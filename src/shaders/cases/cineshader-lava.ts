// CineShader Lava — edankwan (3sySRK).
// CC BY-NC-SA 3.0, based on the approved historical mirror and platform default.
// TSL adaptation; see the case LICENSE.md for evidence and changes.
import * as THREE from 'three/webgpu';
import {
  Break,
  Fn,
  If,
  Loop,
  clamp,
  cos,
  dot,
  exp,
  float,
  fract,
  length,
  max,
  mix,
  sin,
  sRGBTransferEOTF,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type F = THREE.Node<'float'>;
type V3 = THREE.Node<'vec3'>;

const smoothUnion = Fn(([a, b, k]: [F, F, F]) => {
  const h = clamp(float(0.5).add(b.sub(a).mul(0.5).div(k)), 0, 1);
  return mix(b, a, h).sub(k.mul(h).mul(float(1).sub(h)));
}).setLayout({
  name: 'lavaSmoothUnion',
  type: 'float',
  inputs: [
    { name: 'a', type: 'float' },
    { name: 'b', type: 'float' },
    { name: 'k', type: 'float' },
  ],
});

// settings = (shape time, blend radius, sphere size).
const field = Fn(([p, settings]: [V3, V3]) => {
  const distance = float(2).toVar();
  Loop(16, ({ i }) => {
    const fi = float(i);
    const time = settings.x.mul(fract(fi.mul(412.531).add(0.513)).sub(0.5)).mul(2);
    const offset = sin(time.add(fi.mul(vec3(52.5126, 64.62744, 632.25)))).mul(vec3(2, 2, 0.8));
    const radius = mix(0.5, 1, fract(fi.mul(412.531).add(0.5124))).mul(settings.z);
    distance.assign(smoothUnion(length(p.add(offset)).sub(radius), distance, settings.y));
  });
  return distance;
}).setLayout({
  name: 'lavaField',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'settings', type: 'vec3' },
  ],
});

const normalAt = Fn(([p, settings]: [V3, V3]) => {
  // Four tetrahedral probes; a larger epsilon avoids float cancellation across backends.
  const k = vec2(1, -1);
  const gradient = k.xyy
    .mul(field(p.add(k.xyy.mul(0.001)), settings))
    .add(k.yyx.mul(field(p.add(k.yyx.mul(0.001)), settings)))
    .add(k.yxy.mul(field(p.add(k.yxy.mul(0.001)), settings)))
    .add(k.xxx.mul(field(p.add(k.xxx.mul(0.001)), settings)));
  return gradient.div(max(length(gradient), 0.000001));
}).setLayout({
  name: 'lavaNormal',
  type: 'vec3',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'settings', type: 'vec3' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const blend = uniform(0.4);
  const size = uniform(1);
  const colorSpeed = uniform(1);
  const attenuation = uniform(0.15);
  const elapsed = float(context.time as unknown as number);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const colorNode = Fn(() => {
    const screen = uv();
    const aspect = resolution.x.div(resolution.y);
    // Preserve the original landscape scale; fit six world units across portrait screens.
    const origin = vec3(
      screen
        .sub(0.5)
        .mul(vec2(aspect, 1))
        .mul(6)
        .mul(max(1, float(1).div(aspect))),
      3,
    );
    const settings = vec3(elapsed.mul(speed).add(8), blend, size);
    const depth = float(0).toVar();
    const point = origin.toVar();
    Loop(64, () => {
      point.assign(origin.add(vec3(0, 0, depth.negate())));
      const distance = field(point, settings).toVar();
      If(distance.lessThan(0.001), () => {
        Break();
      });
      depth.addAssign(distance);
      If(depth.greaterThanEqual(6), () => {
        depth.assign(6);
        Break();
      });
    });
    const brightness = float(0).toVar();
    If(depth.lessThan(6), () => {
      brightness.assign(max(0, dot(normalAt(point, settings), vec3(0.577))));
    });
    const phase = brightness.add(elapsed.mul(colorSpeed).add(8).mul(3));
    const color = cos(phase.add(screen.xyx.mul(2)).add(vec3(0, 2, 4)))
      .mul(0.5)
      .add(0.5)
      .mul(brightness.mul(0.35).add(0.85))
      .mul(exp(depth.mul(attenuation).negate()));
    // Original alpha stores CineShader thickness, not compositing opacity.
    return sRGBTransferEOTF(clamp(color, 0, 1)) as V3;
  })();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  return {
    material,
    controls: [
      {
        id: 'lava-speed',
        kind: 'number',
        label: '形体速度',
        description: '改变球体运动速度；零值固定在初始形态。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'lava-blend',
        kind: 'number',
        label: '融合程度',
        description: '改变球体连接处的圆滑范围。',
        min: 0.05,
        max: 0.8,
        step: 0.05,
        initial: 0.4,
        uniform: blend,
      },
      {
        id: 'lava-size',
        kind: 'number',
        label: '球体大小',
        description: '改变球体半径，观察分离与相连的形态。',
        min: 0.7,
        max: 1.2,
        step: 0.05,
        initial: 1,
        uniform: size,
      },
      {
        id: 'lava-color-speed',
        kind: 'number',
        label: '色彩速度',
        description: '独立改变颜色循环速度，不改变形体运动。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: colorSpeed,
      },
      {
        id: 'lava-attenuation',
        kind: 'number',
        label: '景深衰减',
        description: '让远处颜色更暗；零值取消距离衰减。',
        min: 0,
        max: 0.35,
        step: 0.01,
        initial: 0.15,
        uniform: attenuation,
      },
    ],
  };
};
export default createShader;
