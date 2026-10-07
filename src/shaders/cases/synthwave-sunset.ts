// another synthwave sunset thing — stduhpf (tsScRK).
// CC BY-NC-SA 3.0 under the user-approved historical default-license evidence.
// Implements the source's default silent mode. See this case's LICENSE.md.
import * as THREE from 'three/webgpu';
import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  clamp,
  cos,
  dot,
  exp,
  exp2,
  float,
  floor,
  fract,
  length,
  max,
  min,
  mix,
  mod,
  normalize,
  pow,
  reflect,
  sRGBTransferEOTF,
  select,
  sin,
  smoothstep,
  sqrt,
  step,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type F = THREE.Node<'float'>;
type V2 = THREE.Node<'vec2'>;
type V3 = THREE.Node<'vec3'>;

const hash21 = Fn(([point]: [V2]) =>
  fract(sin(dot(point, vec2(1.9898, 7.233))).mul(45758.5433)),
).setLayout({ name: 'sunsetHash21', type: 'float', inputs: [{ name: 'point', type: 'vec2' }] });

// Nine squarings preserve the original pow512 instead of substituting pow().
const power512 = Fn(([base]: [F]) => {
  const value = base.toVar();
  for (let i = 0; i < 9; i++) value.mulAssign(value);
  return value;
}).setLayout({ name: 'sunsetPower512', type: 'float', inputs: [{ name: 'base', type: 'float' }] });

const vertexHeight = Fn(([point, time]: [V2, F]) => {
  const amplitude = smoothstep(1, 8, abs(point.x));
  const wave = float(0.51).add(
    sin(point.y.add(point.x.mul(0.5)).mul(0.02).sub(time).mul(2)).mul(0.49),
  );
  const random = hash21(point);
  return amplitude.mul(random.mul(sqrt(random))).mul(float(1).sub(power512(wave).mul(0.4)));
}).setLayout({
  name: 'sunsetVertexHeight',
  type: 'float',
  inputs: [
    { name: 'point', type: 'vec2' },
    { name: 'time', type: 'float' },
  ],
});

// The source's trinoise returns both height and a triangular-edge mask distance.
// This is a mathematical triangle lattice, not a tessellated Three.js mesh.
const triangleSample = Fn(([position, time]: [V2, F]) => {
  const point = position.toVar();
  point.x.mulAssign(Math.sqrt(3 / 2));
  point.y.subAssign(point.x.mul(0.5));
  const fraction = fract(point);
  const cell = point.sub(fraction);
  const upper = dot(fraction, vec2(1)).greaterThan(1);
  const inverse = vec2(1).sub(fraction);
  const da = select(upper, inverse, fraction);
  const db = select(upper, fraction, inverse);
  const first = vertexHeight(cell.add(float(upper)), time);
  const second = vertexHeight(cell.add(vec2(1, 0)), time);
  const third = vertexHeight(cell.add(vec2(0, 1)), time);
  const middle = mix(second, third, fraction.y);
  const side = mix(first, select(upper, second, third), da.y);
  const blend = da.x.div(db.y);
  const height = mix(side, middle, blend);
  // The original audio-dependent edge weights are all 1 in its default mode.
  const edge = min(min(float(1).sub(blend).mul(db.y), da.x), da.y);
  return vec2(height, edge);
}).setLayout({
  name: 'sunsetTriangleSample',
  type: 'vec2',
  inputs: [
    { name: 'position', type: 'vec2' },
    { name: 'time', type: 'float' },
  ],
});

const field = Fn(([point, time, height]: [V3, F, F]) => {
  const sample = triangleSample(point.xz, time);
  return vec2(point.y.sub(sample.x.mul(2).mul(height)), sample.y);
}).setLayout({
  name: 'sunsetField',
  type: 'vec2',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'time', type: 'float' },
    { name: 'height', type: 'float' },
  ],
});

const intersection = Fn(([origin, direction, time, height]: [V3, V3, F, F]) => {
  const distance = float(0).toVar();
  const hit = vec2(-1).toVar();
  Loop(500, () => {
    const point = origin.add(direction.mul(distance)).toVar();
    const sample = field(point, time, height);
    // This is a height difference, not an exact Euclidean signed distance.
    // Taller teaching settings get a shorter step; at height=1 this is source-exact.
    distance.addAssign(sample.x.mul(0.5).div(max(height, 1)));
    If(abs(sample.x).lessThan(distance.mul(0.003)), () => {
      hit.assign(vec2(distance, sample.y));
      Break();
    });
    If(distance.greaterThan(150).or(point.y.greaterThan(max(height, 1).mul(2))), () => {
      Break();
    });
  });
  return hit;
}).setLayout({
  name: 'sunsetIntersection',
  type: 'vec2',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'time', type: 'float' },
    { name: 'height', type: 'float' },
  ],
});

const normalAt = Fn(([point, time, height]: [V3, F, F]) => {
  const center = field(point, time, height).x;
  const epsilon = float(0.005);
  return normalize(
    vec3(
      field(point.add(vec3(epsilon, 0, 0)), time, height).x.sub(center),
      field(point.add(vec3(0, epsilon, 0)), time, height).x.sub(center),
      field(point.add(vec3(0, 0, epsilon)), time, height).x.sub(center),
    ),
  );
}).setLayout({
  name: 'sunsetNormal',
  type: 'vec3',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'time', type: 'float' },
    { name: 'height', type: 'float' },
  ],
});

const stars = Fn(([direction]: [V3]) => {
  const point = normalize(direction).mul(300).toVar();
  const light = float(0).toVar();
  Loop(4, ({ i }) => {
    const fraction = fract(point).sub(0.5);
    const cell = floor(point);
    const glow = float(1).sub(smoothstep(0, 0.5, length(fraction)));
    const density = float(0.06).sub(float(i).mul(float(i)).mul(0.005));
    light.addAssign(glow.mul(step(hash21(cell.xz.div(cell.y)), density)));
    // Row-vector multiplication by the source's mat3, expressed explicitly.
    const rotated = vec3(
      point.x.mul(0.6).add(point.z.mul(0.8)),
      point.y,
      point.z.mul(0.6).sub(point.x.mul(0.8)),
    );
    point.assign(point.mul(0.6).add(rotated.mul(0.5)));
  });
  const gate = dot(sin(direction.mul(10.512)), cos(direction.yzx.mul(10.512)));
  light.mulAssign(light);
  light.mulAssign(
    smoothstep(-Math.PI, -0.9, gate)
      .mul(0.5)
      .add(smoothstep(-0.3, 1, gate).mul(0.5)),
  );
  return light.mul(light);
}).setLayout({ name: 'sunsetStars', type: 'float', inputs: [{ name: 'direction', type: 'vec3' }] });

const sky = Fn(([direction, time, sunSize, visible]: [V3, F, F, F]) => {
  const sunDirection = normalize(vec3(0, sin(time.mul(0.1)).mul(0.05).add(0.125), 1));
  const haze = exp2(abs(direction.y).sub(dot(direction, sunDirection).mul(0.2)).mul(-5));
  const starLight = stars(direction)
    .mul(float(1).sub(min(haze, 1)))
    .mul(visible);
  const color = clamp(mix(vec3(0.4, 0.1, 0.7), vec3(0.7, 0.1, 0.4), haze).add(starLight), 0, 1);
  // Ascending smoothstep edges are defined on both WGSL and GLSL.
  const disk = float(1).sub(
    smoothstep(sunSize.mul(0.2), sunSize.mul(0.21), length(direction.sub(sunDirection))),
  );
  const stripe = smoothstep(-0.8, 0, sin(exp(direction.y.sub(sunDirection.y).mul(-14)).mul(3.1)));
  return mix(color, vec3(1, 0.8, 0.4).mul(0.75), disk.mul(stripe).mul(visible));
}).setLayout({
  name: 'sunsetSky',
  type: 'vec3',
  inputs: [
    { name: 'direction', type: 'vec3' },
    { name: 'time', type: 'float' },
    { name: 'sunSize', type: 'float' },
    { name: 'visible', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    height = uniform(1),
    glow = uniform(1),
    sunSize = uniform(1),
    fogDensity = uniform(1);
  const time = mod(
    float(context.time as unknown as number)
      .mul(speed)
      .add(2),
    4000,
  );
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const screen = uv().mul(2).sub(1).toVar();
    screen.x.mulAssign(resolution.x.div(resolution.y));
    const origin = vec3(0, 1, time.mul(10).sub(20000));
    const direction = normalize(vec3(screen, 4 / 3));
    const hit = intersection(origin, direction, time, height);
    const color = vec3(sky(direction, time, sunSize, float(1))).toVar();
    If(hit.x.greaterThan(0), () => {
      const point = origin.add(direction.mul(hit.x));
      const normal = normalAt(point, time, height);
      const light = normalize(vec3(0, sin(time.mul(0.1)).mul(0.05).add(0.125), 1));
      const diffuse = dot(normal, light).add(normal.y.mul(0.1));
      const surface = vec3(0.1, 0.11, 0.18).mul(diffuse).toVar();
      const reflected = sky(reflect(direction, normal), time, sunSize, float(1));
      const fresnel = pow(max(float(1).add(dot(direction, normal)), 0), 5)
        .mul(0.95)
        .add(0.05);
      surface.assign(mix(surface, reflected, fresnel));
      const edge = float(1).sub(smoothstep(0, 0.05, hit.y));
      surface.assign(mix(surface, vec3(0.8, 0.1, 0.92).mul(glow), edge));
      const fog = exp2(vec3(-0.14, -0.1, -0.28).mul(hit.x).mul(fogDensity));
      const skyColor = vec3(sky(direction, time, sunSize, float(0)));
      color.assign(skyColor.mul(vec3(1).sub(fog)).add(surface.mul(fog)));
    });
    return sRGBTransferEOTF(clamp(color, 0, 1)) as V3;
  })();
  return {
    material,
    controls: [
      {
        kind: 'number',
        id: 'sunset-speed',
        label: '行进速度',
        description: '改变相机与地形起伏的时间推进；0 会停在初始构图。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        kind: 'number',
        id: 'sunset-height',
        label: '地形高度',
        description: '缩放三角格点高度，观察平面网格怎样长成山路。',
        min: 0.3,
        max: 1.8,
        step: 0.05,
        initial: 1,
        uniform: height,
      },
      {
        kind: 'number',
        id: 'sunset-glow',
        label: '网格亮度',
        description: '改变三角边线的颜色强度，不改变地形或后处理。',
        min: 0,
        max: 1.8,
        step: 0.05,
        initial: 1,
        uniform: glow,
      },
      {
        kind: 'number',
        id: 'sunset-sun',
        label: '太阳大小',
        description: '改变太阳圆盘的角半径，横向条纹仍由方向高度决定。',
        min: 0.65,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: sunSize,
      },
      {
        kind: 'number',
        id: 'sunset-fog',
        label: '雾密度',
        description: '改变远处地形融入天空的速度，观察距离与深度感。',
        min: 0.5,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: fogDensity,
      },
    ],
  };
};

export default createShader;
