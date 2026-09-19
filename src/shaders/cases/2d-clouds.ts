// 2D Clouds — drift (4tdSWr), historical Shadertoy default CC BY-NC-SA 3.0.
// See the case LICENSE.md for the approved mirror evidence and adaptation scope.
import * as THREE from 'three/webgpu';
import {
  Fn,
  Loop,
  abs,
  clamp,
  dot,
  float,
  floor,
  fract,
  max,
  mix,
  select,
  sin,
  sRGBTransferEOTF,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';
type F = THREE.Node<'float'>;
type V2 = THREE.Node<'vec2'>;

// Preserve the source gradient hash; floating-point trig can differ across GPU backends.
const gradient = Fn(([p]: [V2]) => {
  const pair = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(pair).mul(43758.5453123)).mul(2).sub(1);
}).setLayout({ name: 'cloudGradient', type: 'vec2', inputs: [{ name: 'p', type: 'vec2' }] });

const noise = Fn(([p]: [V2]) => {
  // Skew into triangular cells, then unskew the three corner displacements.
  const cell = floor(p.add(p.x.add(p.y).mul(0.366025404))).toVar();
  const a = p.sub(cell).add(cell.x.add(cell.y).mul(0.211324865)).toVar();
  const corner = select(a.x.greaterThan(a.y), vec2(1, 0), vec2(0, 1)).toVar();
  const b = a.sub(corner).add(0.211324865).toVar();
  const c = a
    .sub(1)
    .add(2 * 0.211324865)
    .toVar();
  const h = max(vec3(0.5).sub(vec3(dot(a, a), dot(b, b), dot(c, c))), 0).toVar();
  const contributions = vec3(
    dot(a, gradient(cell)),
    dot(b, gradient(cell.add(corner))),
    dot(c, gradient(cell.add(1))),
  );
  return dot(h.mul(h).mul(h).mul(h).mul(contributions), vec3(70));
}).setLayout({ name: 'cloudNoise', type: 'float', inputs: [{ name: 'p', type: 'vec2' }] });

// GLSL mat2(1.6, 1.2, -1.2, 1.6) * p: column-major, matrix on the LEFT.
const octavePosition = (p: V2) =>
  vec2(p.x.mul(1.6).sub(p.y.mul(1.2)), p.x.mul(1.2).add(p.y.mul(1.6)));
const warpNoise = Fn(([p]: [V2]) => {
  const q = p.toVar();
  const value = float(0).toVar();
  const weight = float(0.1).toVar();
  Loop(7, () => {
    value.addAssign(noise(q).mul(weight));
    q.assign(octavePosition(q));
    weight.mulAssign(0.4);
  });
  return value;
}).setLayout({ name: 'cloudWarp', type: 'float', inputs: [{ name: 'p', type: 'vec2' }] });

// Separate bounded loops keep the shader compact instead of expanding every noise call.
const stack = (name: string, count: number, initial: number, decay: number, ridged: boolean) =>
  Fn(([p, time]: [V2, F]) => {
    const q = p.toVar();
    const value = float(0).toVar();
    const weight = float(initial).toVar();
    Loop(count, () => {
      const sample = noise(q).mul(weight);
      value.addAssign(ridged ? abs(sample) : sample);
      q.assign(octavePosition(q).add(time));
      weight.mulAssign(decay);
    });
    return value;
  }).setLayout({
    name,
    type: 'float',
    inputs: [
      { name: 'p', type: 'vec2' },
      { name: 'time', type: 'float' },
    ],
  });
const ridgeShape = stack('cloudRidgeShape', 8, 0.8, 0.7, true);
const signedShape = stack('cloudSignedShape', 8, 0.7, 0.6, false);
const signedColor = stack('cloudSignedColor', 7, 0.4, 0.6, false);
const ridgeColor = stack('cloudRidgeColor', 7, 0.4, 0.6, true);

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const scale = uniform(1.1);
  const cover = uniform(0.2);
  const alpha = uniform(8);
  const light = uniform(0.3);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(2)
    .mul(0.03);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const p = uv().toVar();
    const base = p
      .mul(vec2(resolution.x.div(resolution.y), 1))
      .mul(scale)
      .toVar();
    const q = warpNoise(base.mul(0.5)).toVar();
    const shapePosition = base.sub(q).add(time).toVar();
    const r = ridgeShape(shapePosition, time).toVar();
    const f = signedShape(shapePosition, time).toVar();
    f.mulAssign(r.add(f));
    const t2 = time.mul(2),
      t3 = time.mul(3);
    const detail = signedColor(base.mul(2).sub(q).add(t2), t2)
      .add(ridgeColor(base.mul(3).sub(q).add(t3), t3))
      .toVar();
    const sky = mix(vec3(0.4, 0.7, 1), vec3(0.2, 0.4, 0.6), p.y);
    const cloud = vec3(1.1, 1.1, 0.9).mul(clamp(float(0.5).add(light.mul(detail)), 0, 1));
    const mask = clamp(cover.add(alpha.mul(f).mul(r)).add(detail), 0, 1);
    const display = mix(sky, clamp(sky.mul(0.5).add(cloud), 0, 1), mask);
    return sRGBTransferEOTF(display) as THREE.Node<'vec3'>;
  })();
  return {
    material,
    controls: [
      {
        id: 'cloud-speed',
        kind: 'number',
        label: '流动速度',
        description: '改变各层噪声的时间推进倍率；零值停在初始云形。',
        min: 0,
        max: 3,
        step: 0.1,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'cloud-scale',
        kind: 'number',
        label: '云团尺度',
        description: '采样频率越高，同一画面内的云团越小、越密。',
        min: 0.5,
        max: 2.5,
        step: 0.05,
        initial: 1.1,
        uniform: scale,
      },
      {
        id: 'cloud-cover',
        kind: 'number',
        label: '云量',
        description: '向混合遮罩添加偏移，观察蓝天如何被云层覆盖。',
        min: -0.3,
        max: 0.6,
        step: 0.05,
        initial: 0.2,
        uniform: cover,
      },
      {
        id: 'cloud-alpha',
        kind: 'number',
        label: '云层不透明度',
        description: '放大形状信号后再限制到零至一，影响云边和厚度。',
        min: 2,
        max: 12,
        step: 0.5,
        initial: 8,
        uniform: alpha,
      },
      {
        id: 'cloud-light',
        kind: 'number',
        label: '细节明暗',
        description: '控制颜色噪声对云层亮度的贡献，并非真实光照强度。',
        min: 0,
        max: 0.6,
        step: 0.05,
        initial: 0.3,
        uniform: light,
      },
    ],
  };
};
export default createShader;
