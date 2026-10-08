// Very fast procedural ocean — afl_ext (MdXyzX), MIT, copyright 2017-2024.
// ACES fit: Stephen Hill; Baking Lab by MJP / David Neubelt, MIT.
// Preserve the separate source notices and provenance in this case's LICENSE.md.
import * as THREE from 'three/webgpu';
import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  clamp,
  cos,
  cross,
  dot,
  exp,
  float,
  int,
  length,
  max,
  min,
  mix,
  mod,
  normalize,
  pow,
  reflect,
  sRGBTransferEOTF,
  sin,
  sqrt,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type F = THREE.Node<'float'>;
type I = THREE.Node<'int'>;
type V2 = THREE.Node<'vec2'>;
type V3 = THREE.Node<'vec3'>;

const waveWithDrag = Fn(([position, direction, frequency, phase]: [V2, V2, F, F]) => {
  const x = dot(direction, position).mul(frequency).add(phase);
  const wave = exp(sin(x).sub(1));
  // Derivative with respect to phase, negated. It is not the full spatial gradient.
  return vec2(wave, wave.mul(cos(x)).negate());
}).setLayout({
  name: 'oceanWaveWithDrag',
  type: 'vec2',
  inputs: [
    { name: 'position', type: 'vec2' },
    { name: 'direction', type: 'vec2' },
    { name: 'frequency', type: 'float' },
    { name: 'phase', type: 'float' },
  ],
});

const waves = Fn(([position, iterations, time, drag, scale]: [V2, I, F, F, F]) => {
  const point = position.toVar();
  const phaseOffset = length(point).mul(0.1).toVar();
  const angle = float(0).toVar();
  const frequency = scale.toVar();
  const timeMultiplier = float(2).toVar();
  const weight = float(1).toVar();
  const sum = float(0).toVar();
  const weights = float(0).toVar();
  Loop({ start: int(0), end: iterations, type: 'int', condition: '<' }, () => {
    const direction = vec2(sin(angle), cos(angle)).toVar();
    const sample = waveWithDrag(
      point,
      direction,
      frequency,
      time.mul(timeMultiplier).add(phaseOffset),
    ).toVar();
    // Each layer moves the sampling position for the next layer.
    point.addAssign(direction.mul(sample.y).mul(weight).mul(drag));
    sum.addAssign(sample.x.mul(weight));
    weights.addAssign(weight);
    weight.assign(mix(weight, 0, 0.2));
    frequency.mulAssign(1.18);
    timeMultiplier.mulAssign(1.07);
    angle.addAssign(1232.399963);
  });
  return sum.div(weights);
}).setLayout({
  name: 'oceanWaves',
  type: 'float',
  inputs: [
    { name: 'position', type: 'vec2' },
    { name: 'iterations', type: 'int' },
    { name: 'time', type: 'float' },
    { name: 'drag', type: 'float' },
    { name: 'scale', type: 'float' },
  ],
});

const waterIntersection = Fn(
  ([origin, start, direction, depth, time, drag, scale]: [V3, V3, V3, F, F, F, F]) => {
    const point = start.toVar();
    const distance = length(start.sub(origin)).toVar();
    Loop(64, () => {
      const height = waves(point.xz, int(12), time, drag, scale).mul(depth).sub(depth);
      If(height.add(0.01).greaterThan(point.y), () => {
        distance.assign(length(point.sub(origin)));
        Break();
      });
      // A height mismatch is not an exact signed distance to this surface.
      point.addAssign(direction.mul(point.y.sub(height)));
    });
    // Source fallback: keep the upper-plane hit if 64 steps found no surface.
    return distance;
  },
).setLayout({
  name: 'oceanWaterIntersection',
  type: 'float',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'start', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'depth', type: 'float' },
    { name: 'time', type: 'float' },
    { name: 'drag', type: 'float' },
    { name: 'scale', type: 'float' },
  ],
});

const waterNormal = Fn(([point, depth, iterations, time, drag, scale]: [V2, F, I, F, F, F]) => {
  const epsilon = float(0.01);
  const height = waves(point, iterations, time, drag, scale).mul(depth);
  const left = waves(point.sub(vec2(epsilon, 0)), iterations, time, drag, scale).mul(depth);
  const forward = waves(point.add(vec2(0, epsilon)), iterations, time, drag, scale).mul(depth);
  const center = vec3(point.x, height, point.y);
  return normalize(
    cross(
      center.sub(vec3(point.x.sub(epsilon), left, point.y)),
      center.sub(vec3(point.x, forward, point.y.add(epsilon))),
    ),
  );
}).setLayout({
  name: 'oceanWaterNormal',
  type: 'vec3',
  inputs: [
    { name: 'point', type: 'vec2' },
    { name: 'depth', type: 'float' },
    { name: 'iterations', type: 'int' },
    { name: 'time', type: 'float' },
    { name: 'drag', type: 'float' },
    { name: 'scale', type: 'float' },
  ],
});

const atmosphere = Fn(([direction, sun]: [V3, V3]) => {
  // Called only for upward sky/reflection rays; these denominators stay positive.
  const horizon = float(1).div(direction.y.add(0.1));
  const sunHeight = float(1).div(sun.y.mul(11).add(1));
  const alignment = dot(sun, direction);
  const raySun = pow(abs(alignment), 2);
  const sunColor = mix(
    vec3(1),
    max(vec3(0), vec3(1).sub(vec3(5.5, 13, 22.4).div(22.4))),
    sunHeight,
  );
  const blue = vec3(5.5, 13, 22.4).div(22.4).mul(sunColor);
  const haze = max(
    vec3(0),
    blue.sub(
      vec3(5.5, 13, 22.4)
        .mul(0.002)
        .mul(horizon.sub(sun.y.mul(sun.y).mul(6))),
    ),
  );
  // The source computes an unused Mie term; retaining it would not change output.
  return haze
    .mul(horizon)
    .mul(raySun.mul(0.24).add(0.24))
    .mul(pow(float(1).sub(direction.y), 3).add(1))
    .mul(0.5);
}).setLayout({
  name: 'oceanAtmosphere',
  type: 'vec3',
  inputs: [
    { name: 'direction', type: 'vec3' },
    { name: 'sun', type: 'vec3' },
  ],
});

const sunlight = Fn(([direction, sun]: [V3, V3]) =>
  pow(max(0, dot(direction, sun)), 720).mul(210),
).setLayout({
  name: 'oceanSunlight',
  type: 'float',
  inputs: [
    { name: 'direction', type: 'vec3' },
    { name: 'sun', type: 'vec3' },
  ],
});

// The GLSL constructors list columns. Explicit row dot products avoid transposition.
// Stephen Hill's MIT ACES fit, plus afl_ext's output gamma; see upstream/ACES.hlsl.
const acesDisplay = Fn(([color]: [V3]) => {
  const v = vec3(
    dot(color, vec3(0.59719, 0.35458, 0.04823)),
    dot(color, vec3(0.076, 0.90834, 0.01566)),
    dot(color, vec3(0.0284, 0.13383, 0.83777)),
  ).toVar();
  const a = v.mul(v.add(0.0245786)).sub(0.000090537);
  const b = v.mul(v.mul(0.983729).add(0.432951)).add(0.238081);
  const fitted = a.div(b).toVar();
  const output = vec3(
    dot(fitted, vec3(1.60475, -0.53108, -0.07367)),
    dot(fitted, vec3(-0.10208, 1.10813, -0.00605)),
    dot(fitted, vec3(-0.00327, -0.07276, 1.07602)),
  );
  return pow(clamp(output, 0, 1), vec3(1 / 2.2));
}).setLayout({ name: 'oceanAcesDisplay', type: 'vec3', inputs: [{ name: 'color', type: 'vec3' }] });

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    depth = uniform(1),
    drag = uniform(0.38),
    scale = uniform(1),
    detail = uniform(36);
  const time = mod(float(context.time as unknown as number).mul(speed), 4000).add(7);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const pointer = vec2(context.pointer as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const screen = uv().mul(2).sub(1).toVar();
    screen.x.mulAssign(resolution.x.div(resolution.y));
    const projected = normalize(vec3(screen, 1.5));
    const yaw = pointer.x.sub(0.5).mul(6);
    const sourcePitch = float(0.5).add(float(1.5).mul(float(0.27).mul(2).sub(1)));
    const pitch = clamp(pointer.y.sub(0.5).mul(3).add(sourcePitch), -1.2, 1.2);
    const tilted = vec3(
      projected.x,
      projected.y.mul(cos(pitch)).add(projected.z.mul(sin(pitch))),
      projected.z.mul(cos(pitch)).sub(projected.y.mul(sin(pitch))),
    ).toVar();
    const ray = vec3(
      tilted.x.mul(cos(yaw)).add(tilted.z.mul(sin(yaw))),
      tilted.y,
      tilted.z.mul(cos(yaw)).sub(tilted.x.mul(sin(yaw))),
    ).toVar();
    const sun = normalize(
      vec3(-0.0773502691896258, sin(time.mul(0.2).add(2.6)).mul(0.45).add(0.5), 0.5773502691896258),
    );
    const color = vec3(0).toVar();
    If(ray.y.greaterThanEqual(0), () => {
      color.assign(atmosphere(ray, sun).add(sunlight(ray, sun)));
    }).Else(() => {
      const origin = vec3(time.mul(0.2), 1.5, 1);
      const upperDistance = clamp(float(-1.5).div(ray.y), -1, 9991999);
      const start = origin.add(ray.mul(upperDistance));
      const lowerDistance = clamp(float(-1.5).sub(depth).div(ray.y), -1, 9991999);
      const end = origin.add(ray.mul(lowerDistance));
      const direction = ray.toVar();
      // Preserve the source direction except when two clamped plane hits coincide.
      If(length(end.sub(start)).greaterThan(0.0001), () => {
        direction.assign(normalize(end.sub(start)));
      });
      const distance = waterIntersection(origin, start, direction, depth, time, drag, scale);
      const point = origin.add(ray.mul(distance));
      const normal = mix(
        waterNormal(point.xz, depth, int(detail), time, drag, scale),
        vec3(0, 1, 0),
        min(1, sqrt(distance.mul(0.01)).mul(1.1)).mul(0.8),
      );
      // Preserve the source's unnormalized distance-smoothed normal.
      const fresnel = pow(float(1).sub(max(0, dot(normal.negate(), ray))), 5)
        .mul(0.96)
        .add(0.04);
      const reflected = normalize(reflect(ray, normal)).toVar();
      reflected.y.assign(abs(reflected.y));
      const reflection = atmosphere(reflected, sun).add(sunlight(reflected, sun));
      const scattering = vec3(0.0293, 0.0698, 0.1717)
        .mul(0.1)
        .mul(point.y.add(depth).div(depth).add(0.2));
      color.assign(reflection.mul(fresnel).add(scattering));
    });
    // Preserve the original display values through the site's common sRGB output.
    return sRGBTransferEOTF(acesDisplay(color.mul(2))) as V3;
  })();
  return {
    material,
    controls: [
      {
        kind: 'number',
        id: 'ocean-speed',
        label: '时间速度',
        description: '同时推进波浪、相机和太阳；0 停在原作第 7 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        kind: 'number',
        id: 'ocean-depth',
        label: '波高范围',
        description: '把海面高度限制在 −depth 到 0；也会改变法线的倾斜。',
        min: 0.35,
        max: 1.8,
        step: 0.05,
        initial: 1,
        uniform: depth,
      },
      {
        kind: 'number',
        id: 'ocean-drag',
        label: '波形拖拽',
        description: '改变每层波形对后续采样坐标的拖拽；0 便于观察直接叠加。',
        min: 0,
        max: 0.7,
        step: 0.01,
        initial: 0.38,
        uniform: drag,
      },
      {
        kind: 'number',
        id: 'ocean-frequency',
        label: '起始频率',
        description: '改变第一层波的空间频率，后续每层仍乘 1.18。',
        min: 0.6,
        max: 1.6,
        step: 0.05,
        initial: 1,
        uniform: scale,
      },
      {
        kind: 'number',
        id: 'ocean-detail',
        label: '法线层数',
        description: '改变反光细节的波层数，求交仍使用 12 层；层数越多开销越高。',
        min: 12,
        max: 48,
        step: 1,
        initial: 36,
        uniform: detail,
      },
    ],
  };
};

export default createShader;
