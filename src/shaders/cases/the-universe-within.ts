// The Universe Within — Martijn Steinrucken aka BigWings (2018).
// CC BY-NC-SA 3.0. Silent TSL adaptation of lscczl; see the case LICENSE.md.
import * as THREE from 'three/webgpu';
import {
  Fn,
  Loop,
  abs,
  clamp,
  cos,
  dot,
  float,
  floor,
  fract,
  length,
  max,
  mix,
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
type V3 = THREE.Node<'vec3'>;

const hash = Fn(([p]: [V2]) => {
  const a = fract(vec3(p.x, p.y, p.x).mul(vec3(213.897, 653.453, 253.098))).toVar();
  a.addAssign(dot(a, a.yzx.add(79.76)));
  return fract(a.x.add(a.y).mul(a.z));
}).setLayout({ name: 'universeHash', type: 'float', inputs: [{ name: 'p', type: 'vec2' }] });

const nodePosition = Fn(([id, offset, time]: [V2, V2, F]) => {
  const n = hash(id.add(offset));
  const phase = time.add(n);
  return offset.add(
    vec2(sin(phase.mul(fract(n.mul(10)))), cos(phase.mul(fract(n.mul(100))))).mul(0.4),
  );
}).setLayout({
  name: 'universePosition',
  type: 'vec2',
  inputs: [
    { name: 'id', type: 'vec2' },
    { name: 'offset', type: 'vec2' },
    { name: 'time', type: 'float' },
  ],
});

const connection = Fn(([a, b, p, width]: [V2, V2, V2, F]) => {
  const segment = b.sub(a);
  const relative = p.sub(a);
  // Clamp projection to the segment; protect coincident endpoints from 0/0.
  const h = clamp(dot(relative, segment).div(max(dot(segment, segment), 0.000001)), 0, 1);
  const distance = length(relative.sub(segment.mul(h)));
  const span = length(segment);
  const fade = float(1)
    .sub(smoothstep(0.5, 1.5, span))
    .add(float(1).sub(smoothstep(0.02, 0.05, abs(span.sub(0.75)))));
  return float(1)
    .sub(smoothstep(width.mul(0.25), width, distance))
    .mul(fade);
}).setLayout({
  name: 'universeConnection',
  type: 'float',
  inputs: [
    { name: 'a', type: 'vec2' },
    { name: 'b', type: 'vec2' },
    { name: 'p', type: 'vec2' },
    { name: 'width', type: 'float' },
  ],
});

const network = Fn(([st, layer, time, width, intensity]: [V2, F, F, F, F]) => {
  const id = floor(st).add(layer);
  const local = fract(st).sub(0.5);
  // These JS loops build nine shader expressions once, not a per-frame CPU simulation.
  const points: V2[] = [];
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) points.push(nodePosition(id, vec2(x, y), time).toVar());
  }
  const lines = float(0).toVar();
  const sparkle = float(0).toVar();
  for (let i = 0; i < 9; i++) {
    // The original connects the center to itself; omit that undefined zero-length line.
    if (i !== 4) lines.addAssign(connection(points[4], points[i], local, width));
    const d = length(local.sub(points[i]));
    const pulse = sin(fract(points[i].x).add(fract(points[i].y)).add(time).mul(5))
      .mul(0.4)
      .add(0.6);
    sparkle.addAssign(
      float(0.005)
        .div(max(d.mul(d), 0.0001))
        .mul(float(1).sub(smoothstep(0.7, 1, d)))
        .mul(pow(pulse, 20)),
    );
  }
  for (const [a, b] of [
    [1, 3],
    [1, 5],
    [7, 5],
    [7, 3],
  ]) {
    lines.addAssign(connection(points[a], points[b], local, width));
  }
  const phase = sin(time.add(layer))
    .add(sin(time.mul(0.1)))
    .mul(0.25)
    .add(0.5)
    .add(pow(sin(time.mul(0.1)).mul(0.5).add(0.5), 50).mul(5));
  return lines.add(sparkle.mul(phase).mul(intensity));
}).setLayout({
  name: 'universeNetwork',
  type: 'float',
  inputs: [
    { name: 'st', type: 'vec2' },
    { name: 'layer', type: 'float' },
    { name: 'time', type: 'float' },
    { name: 'width', type: 'float' },
    { name: 'intensity', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const density = uniform(1);
  const width = uniform(0.04);
  const sparkle = uniform(1);
  const glow = uniform(0.15);
  const elapsed = float(context.time as unknown as number);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const pointer = vec2(context.pointer as unknown as THREE.Vector2).sub(0.5);
  const colorNode = Fn(() => {
    // Start inside the original timeline and omit its 20-second opening / 230-second blackout.
    const time = elapsed.mul(speed).add(30);
    const t = time.mul(0.1);
    const screen = uv()
      .sub(0.5)
      .mul(vec2(resolution.x.div(resolution.y), 1));
    const rotate = (p: V2) =>
      vec2(p.x.mul(cos(t)).sub(p.y.mul(sin(t))), p.x.mul(sin(t)).add(p.y.mul(cos(t))));
    const st = rotate(screen).mul(density);
    const mouse = rotate(pointer).mul(2);
    const light = float(0).toVar();
    Loop(4, ({ i }) => {
      const layer = float(i).div(4);
      const z = fract(t.add(layer));
      const size = mix(15, 1, z);
      const fade = smoothstep(0, 0.6, z).mul(float(1).sub(smoothstep(0.8, 1, z)));
      light.addAssign(
        network(st.mul(size).sub(mouse.mul(z)), layer, time, width, sparkle).mul(fade),
      );
    });
    const base = vec3(sin(t), cos(t.mul(0.4)), sin(t.mul(0.24)).negate())
      .mul(0.4)
      .add(0.6);
    // Original FFT only drove this lower-screen glow. No audio fetch or music is required.
    const color = base
      .mul(light.add(screen.y.negate().mul(glow).mul(2)))
      .mul(max(float(1).sub(dot(screen, screen)), 0));
    return sRGBTransferEOTF(max(color, vec3(0))) as V3;
  })();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  return {
    material,
    controls: [
      {
        id: 'universe-speed',
        kind: 'number',
        label: '穿行速度',
        description: '同时改变层次穿行、节点摆动和色彩变化的时间速度。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'universe-density',
        kind: 'number',
        label: '星网密度',
        description: '缩放采样坐标，比较稀疏大结构与密集细网。',
        min: 0.5,
        max: 1.8,
        step: 0.05,
        initial: 1,
        uniform: density,
      },
      {
        id: 'universe-width',
        kind: 'number',
        label: '连线宽度',
        description: '改变线段距离遮罩的边界，观察网络结构。',
        min: 0.015,
        max: 0.07,
        step: 0.005,
        initial: 0.04,
        uniform: width,
      },
      {
        id: 'universe-sparkle',
        kind: 'number',
        label: '节点闪光',
        description: '缩放节点脉冲辉光；设为零可单独观察连线。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: sparkle,
      },
      {
        id: 'universe-glow',
        kind: 'number',
        label: '背景辉光',
        description: '替代原作音频频谱强度，控制画面下部的亮度渐变。',
        min: 0,
        max: 0.5,
        step: 0.01,
        initial: 0.15,
        uniform: glow,
      },
    ],
  };
};

export default createShader;
