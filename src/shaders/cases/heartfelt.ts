// The MIT notice below applies to hash31 only; the Heartfelt adaptation is CC BY-NC-SA 3.0.
/* Copyright (c)2014 David Hoskins.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/
// Heartfelt — Martijn Steinrucken / BigWIngs (ltffzl), CC BY-NC-SA 3.0.
// Silent rain study with an original generated background. See case LICENSE.md.
// N13 uses David Hoskins's MIT hash31 (4djSRW Common), not the older variant.
import * as THREE from 'three/webgpu';
import {
  Fn,
  abs,
  clamp,
  dot,
  float,
  floor,
  fract,
  length,
  max,
  mix,
  sin,
  smoothstep,
  sqrt,
  sRGBTransferEOTF,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type F = THREE.Node<'float'>;
type V2 = THREE.Node<'vec2'>;

// Build once on the CPU. No remote image, audio or per-frame texture upload.
function createLights(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0d1525';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let seed = 718;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 140; i++) {
    const x = random() * 2048,
      y = random() * 1024,
      r = 4 + random() * 35;
    const warm = i % 3 === 0;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
    gradient.addColorStop(0, warm ? '#ffe9b0' : '#c9f4ff');
    gradient.addColorStop(0.3, warm ? '#faaa57' : '#41baf0');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
  }
  const map = new THREE.CanvasTexture(canvas);
  // Treat the stored display RGB as data; decode once after composition below.
  map.colorSpace = THREE.NoColorSpace;
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.generateMipmaps = true;
  return map;
}

const hash31 = Fn(([p]: [F]) => {
  const p3 = fract(vec3(p).mul(vec3(0.1031, 0.103, 0.0973))).toVar();
  p3.addAssign(dot(p3, p3.yzx.add(33.33)));
  return fract(p3.xxy.add(p3.yzz).mul(p3.zyx));
}).setLayout({ name: 'heartfeltHash31', type: 'vec3', inputs: [{ name: 'p', type: 'float' }] });

// Ordered edges on both backends. The original repeatedly calls reversed smoothstep.
const falling = (low: number | F, high: number | F, value: F) =>
  float(1).sub(smoothstep(low, high, value));
const saw = (edge: number, value: F) => smoothstep(0, edge, value).mul(falling(edge, 1, value));
const noise = (value: F) => fract(sin(value.mul(12345.564)).mul(7658.76));

const layer = Fn(([point, time]: [V2, F]) => {
  const p = point.toVar();
  p.y.addAssign(time.mul(0.75));
  const grid = vec2(12, 2);
  const id = floor(p.mul(grid)).toVar();
  p.y.addAssign(noise(id.x));
  id.assign(floor(p.mul(grid)));
  const n = hash31(id.x.mul(35.2).add(id.y.mul(2376.1))).toVar();
  const st = fract(p.mul(grid)).sub(vec2(0.5, 0)).toVar();
  const x = n.x.sub(0.5).toVar();
  const wave = point.y.mul(20);
  x.addAssign(
    sin(wave.add(sin(wave)))
      .mul(float(0.5).sub(abs(x)))
      .mul(n.z.sub(0.5)),
  );
  x.mulAssign(0.7);
  const y = saw(0.85, fract(time.add(n.z)))
    .sub(0.5)
    .mul(0.9)
    .add(0.5)
    .toVar();
  const d = length(st.sub(vec2(x, y)).mul(vec2(1, 6)));
  const main = falling(0, 0.4, d);
  const r = sqrt(falling(y, float(1), st.y)).toVar();
  const cd = abs(st.x.sub(x));
  // At r=0 the two original trail edges coincide. A positive width avoids 0/0.
  const low = r.mul(r).mul(0.15);
  const high = max(r.mul(0.23), low.add(0.00001));
  const front = smoothstep(-0.02, 0.02, st.y.sub(y));
  const trail = falling(low, high, cd).mul(front).mul(r.mul(r));
  const row = fract(point.y.mul(10)).add(st.y.sub(0.5));
  const droplets = falling(0, 0.3, length(st.sub(vec2(x, row))));
  return vec2(main.add(droplets.mul(r).mul(front)), trail);
}).setLayout({
  name: 'heartfeltLayer',
  type: 'vec2',
  inputs: [
    { name: 'point', type: 'vec2' },
    { name: 'time', type: 'float' },
  ],
});

const drops = Fn(([point, time, amount]: [V2, F, F]) => {
  const p = point.mul(40).toVar();
  const id = floor(p);
  p.assign(fract(p).sub(0.5));
  const n = hash31(id.x.mul(107.45).add(id.y.mul(3543.654))).toVar();
  const distance = length(p.sub(n.xy.sub(0.5).mul(0.7)));
  const stationary = falling(0, 0.3, distance)
    .mul(fract(n.z.mul(10)))
    .mul(saw(0.025, fract(time.add(n.z))));
  const l0 = smoothstep(-0.5, 1, amount).mul(2).mul(amount);
  const l1 = smoothstep(0.25, 0.75, amount);
  const l2 = smoothstep(0, 0.5, amount);
  const a = layer(point, time).mul(l1).toVar();
  const b = layer(point.mul(1.85), time).mul(l2).toVar();
  return vec2(
    smoothstep(0.3, 1, stationary.mul(l0).add(a.x).add(b.x)),
    max(a.y.mul(l0), b.y.mul(l1)),
  );
}).setLayout({
  name: 'heartfeltDrops',
  type: 'vec2',
  inputs: [
    { name: 'point', type: 'vec2' },
    { name: 'time', type: 'float' },
    { name: 'amount', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    rain = uniform(0.8),
    fog = uniform(1),
    refraction = uniform(1),
    scale = uniform(1);
  const elapsed = float(context.time as unknown as number);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const background = createLights();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const screen = uv();
    const aspect = resolution.x.div(resolution.y);
    // Height-based coordinates preserve round drops in portrait as well as landscape.
    const p = screen.sub(0.5).mul(vec2(aspect, 1)).mul(scale).toVar();
    const t = elapsed.mul(speed).add(35).mul(0.2);
    const c = drops(p, t, rain).toVar();
    const cx = drops(p.add(vec2(0.001, 0)), t, rain).x;
    const cy = drops(p.add(vec2(0, 0.001)), t, rain).x;
    const normal = vec2(cx.sub(c.x), cy.sub(c.x)).mul(refraction);
    const focus = mix(
      max(float(6).mul(fog).sub(c.y), 0),
      float(2).mul(fog),
      smoothstep(0.1, 0.2, c.x),
    );
    // Crop the 2:1 lights image instead of stretching its circular highlights.
    const fit = vec2(aspect.div(2).min(1), float(2).div(aspect).min(1));
    const coord = screen.sub(0.5).mul(fit).add(0.5).add(normal);
    const color = texture(background, coord).level(focus).rgb;
    const vignette = float(1).sub(dot(screen.sub(0.5), screen.sub(0.5)).mul(0.6));
    return sRGBTransferEOTF(clamp(color.mul(vignette), 0, 1)) as THREE.Node<'vec3'>;
  })();
  material.addEventListener('dispose', () => background.dispose());
  return {
    material,
    controls: [
      {
        id: 'rain-speed',
        kind: 'number',
        label: '下落速度',
        description: '改变雨滴滑动速度；零值固定在初始时刻。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'rain-amount',
        kind: 'number',
        label: '雨量',
        description: '逐渐叠加静止水珠和两层流动雨滴；零值去掉全部水滴。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 0.8,
        uniform: rain,
      },
      {
        id: 'rain-fog',
        kind: 'number',
        label: '玻璃雾气',
        description: '改变背景采样的 mip 层级；水滴与拖痕区域更清晰。',
        min: 0,
        max: 1.4,
        step: 0.05,
        initial: 1,
        uniform: fog,
      },
      {
        id: 'rain-refraction',
        kind: 'number',
        label: '折射强度',
        description: '改变雨滴高度差对背景坐标的偏移；零值保留雾气变化。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: refraction,
      },
      {
        id: 'rain-scale',
        kind: 'number',
        label: '雨滴密度',
        description: '缩放雨滴坐标；数值越大，水滴越小、同屏越多。',
        min: 0.6,
        max: 1.6,
        step: 0.05,
        initial: 1,
        uniform: scale,
      },
    ],
  };
};
export default createShader;
