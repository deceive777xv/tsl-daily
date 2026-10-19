/*
 * Voronoise — iq / Inigo Quilez (Xd23Dh).
 * Copyright © 2014 Inigo Quilez. MIT, including this TSL adaptation.
 * The approved historical snapshot contains the complete grant; see LICENSE.md.
 */
import * as THREE from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  clamp,
  cos,
  dot,
  float,
  floor,
  fract,
  int,
  length,
  pow,
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

const cellRandom = Fn(([cell]: [V2]) => {
  const projected = vec3(
    dot(cell, vec2(127.1, 311.7)),
    dot(cell, vec2(269.5, 183.3)),
    dot(cell, vec2(419.2, 371.9)),
  );
  return fract(sin(projected).mul(43758.5453));
}).setLayout({
  name: 'voronoiseCellRandom',
  type: 'vec3',
  inputs: [{ name: 'cell', type: 'vec2' }],
});

const noiseField = Fn(([point, jitter, softness]: [V2, F, F]) => {
  const cell = floor(point).toVar();
  const fraction = fract(point).toVar();
  const exponent = float(1)
    .add(pow(float(1).sub(softness), 6).mul(63))
    .toVar();
  // x sums weighted random values; y sums their weights.
  const accumulated = vec2(0).toVar();
  Loop(
    { start: int(-2), end: int(3), type: 'int', condition: '<' },
    { start: int(-2), end: int(3), type: 'int', condition: '<' },
    ({ i: y, j: x }) => {
      const neighbor = vec2(float(x), float(y)).toVar();
      const random = cellRandom(cell.add(neighbor))
        .mul(vec3(jitter, jitter, 1))
        .toVar();
      const displacement = neighbor.sub(fraction).add(random.xy).toVar();
      const weight = pow(
        float(1).sub(smoothstep(0, 1.414, length(displacement))),
        exponent,
      ).toVar();
      accumulated.addAssign(vec2(random.z.mul(weight), weight));
    },
  );
  // Preserve the source ratio for every positive sum. If all weights underflow
  // to zero, show finite black rather than dividing zero by zero.
  const value = float(0).toVar();
  If(accumulated.y.greaterThan(0), () => {
    value.assign(accumulated.x.div(accumulated.y));
  });
  return value;
}).setLayout({
  name: 'voronoiseWeightedField',
  type: 'float',
  inputs: [
    { name: 'point', type: 'vec2' },
    { name: 'jitter', type: 'float' },
    { name: 'softness', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const density = uniform(24);
  const jitterOffset = uniform(0);
  const softnessOffset = uniform(0);
  const contrast = uniform(1);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(4);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    // Source fragCoord / iResolution.xx keeps cells square at every aspect ratio.
    const point = uv()
      .mul(vec2(1, resolution.y.div(resolution.x)))
      .mul(density);
    const shape = float(0.5)
      .sub(cos(time.add(vec2(0, 2))).mul(0.5))
      .toVar();
    // Three successive cubic smoothings are part of the original time driver.
    for (let pass = 0; pass < 3; pass++) {
      shape.assign(shape.mul(shape).mul(float(3).sub(shape.mul(2))));
    }
    const jitter = clamp(shape.x.add(jitterOffset), 0, 1);
    const softness = clamp(shape.y.add(softnessOffset), 0, 1);
    const value = noiseField(point, jitter, softness);
    const gray = clamp(value.sub(0.5).mul(contrast).add(0.5), 0, 1);
    // The original writes display-space grayscale; decode before sRGB output.
    return sRGBTransferEOTF(vec3(gray)) as THREE.Node<'vec3'>;
  })();
  return {
    material,
    controls: [
      {
        id: 'voronoise-speed',
        kind: 'number',
        label: '形态速度',
        description: '推进扰动与柔度的两组相位；零值回到原作第 4 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'voronoise-density',
        kind: 'number',
        label: '格子密度',
        description: '控制横向的格子数量；改变尺寸，不增加邻域查询次数。',
        min: 8,
        max: 48,
        step: 1,
        initial: 24,
        uniform: density,
      },
      {
        id: 'voronoise-jitter',
        kind: 'number',
        label: '扰动偏移',
        description: '偏移原作的点位扰动；-1 固定为规则格点，1 固定为完整扰动。',
        min: -1,
        max: 1,
        step: 0.05,
        initial: 0,
        uniform: jitterOffset,
      },
      {
        id: 'voronoise-softness',
        kind: 'number',
        label: '柔度偏移',
        description: '偏移原作的权重柔度；-1 保持硬边，1 让邻点宽范围融合。',
        min: -1,
        max: 1,
        step: 0.05,
        initial: 0,
        uniform: softnessOffset,
      },
      {
        id: 'voronoise-contrast',
        kind: 'number',
        label: '灰度对比',
        description: '围绕中灰调整明暗，保留特征点与混合权重。',
        min: 0.5,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: contrast,
      },
    ],
  };
};
export default createShader;
