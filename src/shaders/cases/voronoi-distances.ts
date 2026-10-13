/*
 * Voronoi - distances — iq / Inigo Quilez (ldl3W8).
 * MIT, including this TSL adaptation. See the case LICENSE.md.
 * The approved historical source includes its own procedural hash alternative;
 * this version uses that alternative and never requests the original noise image.
 */
import * as THREE from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  clamp,
  dot,
  float,
  floor,
  fract,
  int,
  length,
  min,
  mix,
  normalize,
  sin,
  smoothstep,
  sRGBTransferEOTF,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type F = THREE.Node<'float'>;
type V2 = THREE.Node<'vec2'>;

const featurePoint = Fn(([cell, time, motion]: [V2, F, F]) => {
  // The source's commented procedural hash replaces its unverified texture.
  const seed = fract(
    sin(vec2(dot(cell, vec2(127.1, 311.7)), dot(cell, vec2(269.5, 183.3)))).mul(43758.5453),
  ).toVar();
  const animated = sin(time.add(seed.mul(6.2831)))
    .mul(0.5)
    .add(0.5);
  return mix(seed, animated, motion);
}).setLayout({
  name: 'voronoiFeaturePoint',
  type: 'vec2',
  inputs: [
    { name: 'cell', type: 'vec2' },
    { name: 'time', type: 'float' },
    { name: 'motion', type: 'float' },
  ],
});

const borderDistance = Fn(([point, time, motion]: [V2, F, F]) => {
  const cell = floor(point).toVar();
  const fraction = fract(point).toVar();
  const nearestSquared = float(8).toVar();
  const nearestVector = vec2(0).toVar();
  const nearestCell = vec2(0).toVar();

  Loop(
    { start: int(-1), end: int(2), type: 'int', condition: '<' },
    { start: int(-1), end: int(2), type: 'int', condition: '<' },
    ({ i: y, j: x }) => {
      const neighbor = vec2(float(x), float(y)).toVar();
      const offset = featurePoint(cell.add(neighbor), time, motion);
      const candidate = neighbor.add(offset).sub(fraction).toVar();
      const squared = dot(candidate, candidate).toVar();
      If(squared.lessThan(nearestSquared), () => {
        nearestSquared.assign(squared);
        nearestVector.assign(candidate);
        nearestCell.assign(neighbor);
      });
    },
  );

  // Save the winning vector: the next search compares every neighbor to it.
  const distance = float(8).toVar();
  Loop(
    { start: int(-2), end: int(3), type: 'int', condition: '<' },
    { start: int(-2), end: int(3), type: 'int', condition: '<' },
    ({ i: y, j: x }) => {
      const neighbor = nearestCell.add(vec2(float(x), float(y))).toVar();
      const offset = featurePoint(cell.add(neighbor), time, motion);
      const candidate = neighbor.add(offset).sub(fraction).toVar();
      const separation = candidate.sub(nearestVector).toVar();
      // Skip the winner itself before normalizing the pair's separation.
      If(dot(separation, separation).greaterThan(0.00001), () => {
        const midpoint = nearestVector.add(candidate).mul(0.5);
        const bisectorDistance = dot(midpoint, normalize(separation));
        distance.assign(min(distance, bisectorDistance));
      });
    },
  );
  return vec3(distance, nearestVector);
}).setLayout({
  name: 'voronoiBorderDistance',
  type: 'vec3',
  inputs: [
    { name: 'point', type: 'vec2' },
    { name: 'time', type: 'float' },
    { name: 'motion', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const density = uniform(8);
  const border = uniform(0.04);
  const contours = uniform(64);
  const motion = uniform(1);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(7);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    // Match fragCoord / iResolution.xx: one cell has equal size on both axes.
    const point = uv()
      .mul(vec2(1, resolution.y.div(resolution.x)))
      .mul(density);
    const sample = borderDistance(point, time, motion).toVar();
    const gray = sample.x.mul(sin(sample.x.mul(contours)).mul(0.5).add(0.5));
    const color = mix(
      vec3(1, 0.6, 0),
      vec3(gray),
      smoothstep(border, border.mul(1.75), sample.x),
    ).toVar();
    const nearest = length(sample.yz).toVar();
    color.assign(mix(vec3(1, 0.6, 0.1), color, smoothstep(0, 0.12, nearest)));
    color.addAssign(vec3(1, 0.6, 0.1).mul(float(1).sub(smoothstep(0, 0.04, nearest))));
    // Source output is display-space RGB. Decode before the shared sRGB output.
    return sRGBTransferEOTF(clamp(color, 0, 1)) as THREE.Node<'vec3'>;
  })();
  return {
    material,
    controls: [
      {
        id: 'voronoi-speed',
        kind: 'number',
        label: '动画速度',
        description: '推进特征点的正弦相位；零值回到原作第 7 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'voronoi-density',
        kind: 'number',
        label: '细胞密度',
        description: '控制画面宽度包含多少个格子；两轴使用同一尺度，保持形状比例。',
        min: 4,
        max: 16,
        step: 0.5,
        initial: 8,
        uniform: density,
      },
      {
        id: 'voronoi-border',
        kind: 'number',
        label: '边框宽度',
        description: '用到边界的距离描边；单位是细胞坐标，不是屏幕像素。',
        min: 0.01,
        max: 0.1,
        step: 0.005,
        initial: 0.04,
        uniform: border,
      },
      {
        id: 'voronoi-contours',
        kind: 'number',
        label: '等距线频率',
        description: '增大距离函数的正弦频率，让细胞内部的等距条纹变密。',
        min: 24,
        max: 96,
        step: 4,
        initial: 64,
        uniform: contours,
      },
      {
        id: 'voronoi-motion',
        kind: 'number',
        label: '点位运动',
        description: '从固定哈希点位过渡到原作的正弦运动；零值保留静止的随机细胞。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 1,
        uniform: motion,
      },
    ],
  };
};
export default createShader;
