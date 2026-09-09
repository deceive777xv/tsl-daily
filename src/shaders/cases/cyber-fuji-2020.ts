// Cyber Fuji 2020 — kaiware007 (Wt33Wf).
// CC BY-NC-SA 3.0, based on the approved historical mirror and platform default.
// This is a TSL adaptation; see the case LICENSE.md for evidence and changes.
import * as THREE from 'three/webgpu';
import {
  Fn,
  If,
  abs,
  clamp,
  cos,
  dot,
  float,
  fract,
  length,
  max,
  min,
  mix,
  mod,
  pow,
  sin,
  smoothstep,
  sqrt,
  step,
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

const segment = Fn(([p, a, b]: [V2, V2, V2]) => {
  const pa = p.sub(a);
  const ba = b.sub(a);
  const h = clamp(dot(pa, ba).div(max(dot(ba, ba), 0.000001)), 0, 1);
  return length(pa.sub(ba.mul(h)));
}).setLayout({
  name: 'fujiSegment',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'a', type: 'vec2' },
    { name: 'b', type: 'vec2' },
  ],
});

const box = Fn(([p, b]: [V2, V2]) => {
  const d = abs(p).sub(b);
  return length(max(d, vec2(0))).add(min(max(d.x, d.y), 0));
}).setLayout({
  name: 'fujiBox',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'b', type: 'vec2' },
  ],
});

const smoothUnion = Fn(([a, b]: [F, F]) => {
  const h = clamp(float(0.5).add(b.sub(a).mul(0.5 / 0.05)), 0, 1);
  return mix(b, a, h).sub(h.mul(float(1).sub(h)).mul(0.05));
}).setLayout({
  name: 'fujiUnion',
  type: 'float',
  inputs: [
    { name: 'a', type: 'float' },
    { name: 'b', type: 'float' },
  ],
});

const cloud = Fn(([p, a, b, c, d]: [V2, V2, V2, V2, V2]) => {
  const left = max(a.add(vec2(0.1125, 0)), c.add(vec2(0.1125, 0)));
  const right = min(b.sub(vec2(0.1125, 0)), d.sub(vec2(0.1125, 0)));
  const center = left.add(right).mul(0.5);
  const bridge = box(p.sub(center), vec2(0.04, abs(c.y.sub(a.y)).mul(0.5))).add(0.075);
  return min(smoothUnion(segment(p, a, b), bridge), smoothUnion(segment(p, c, d), bridge));
}).setLayout({
  name: 'fujiCloud',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'a', type: 'vec2' },
    { name: 'b', type: 'vec2' },
    { name: 'c', type: 'vec2' },
    { name: 'd', type: 'vec2' },
  ],
});

const trapezoid = Fn(([point, r1]: [V2, F]) => {
  const p = vec2(abs(point.x), point.y);
  const k1 = vec2(0.2, 0.5);
  const k2 = vec2(float(0.2).sub(r1), 1);
  const rim = float(0.2).toVar();
  If(p.y.lessThan(0), () => {
    rim.assign(r1);
  });
  const ca = vec2(p.x.sub(min(p.x, rim)), abs(p.y).sub(0.5));
  const cb = p.sub(k1).add(k2.mul(clamp(dot(k1.sub(p), k2).div(dot(k2, k2)), 0, 1)));
  const sign = float(1).toVar();
  If(cb.x.lessThan(0).and(ca.y.lessThan(0)), () => {
    sign.assign(-1);
  });
  return sign.mul(sqrt(min(dot(ca, ca), dot(cb, cb))));
}).setLayout({
  name: 'fujiTrapezoid',
  type: 'float',
  inputs: [
    { name: 'point', type: 'vec2' },
    { name: 'r1', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const density = uniform(1);
  const stripes = uniform(100);
  const snow = uniform(0.05);
  const glow = uniform(1);
  const elapsed = float(context.time as unknown as number);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const colorNode = Fn(() => {
    const time = elapsed.mul(speed).add(8);
    const aspect = resolution.x.div(resolution.y);
    // Keep the entire mountain and sun visible on portrait screens by fitting the width.
    const p = uv()
      .mul(2)
      .sub(1)
      .mul(vec2(aspect, 1))
      .mul(max(1, float(1.5).div(aspect)))
      .toVar();
    // Snapshot before the sky branch shifts p.y; node expressions are otherwise lazy.
    const fog = float(1)
      .sub(smoothstep(-0.02, 0.1, abs(p.y.add(0.2))))
      .toVar();
    const col = vec3(0, 0.1, 0.2).toVar();
    If(p.y.lessThan(-0.2), () => {
      const depth = float(3).div(abs(p.y.add(0.2)).add(0.05));
      const gridUV = vec2(p.x.mul(depth), depth)
        .mul(density)
        .add(vec2(0, time.mul(4.2)));
      const cell = abs(fract(gridUV).sub(0.5));
      const size = vec2(depth, depth.mul(depth).mul(0.2)).mul(0.01).mul(density);
      const lines = vec2(1)
        .sub(smoothstep(vec2(0), size, cell))
        .add(
          vec2(1)
            .sub(smoothstep(vec2(0), size.mul(5), cell))
            .mul(0.4)
            .mul(glow),
        );
      col.assign(mix(col, vec3(1, 0.5, 1), clamp(lines.x.add(lines.y), 0, 3)));
    }).Else(() => {
      const mountainGradient = min(p.y.mul(4.5).sub(0.5), 1).toVar();
      p.y.subAssign(0.59);
      const sunUV = p.add(vec2(0.75, 0.2));
      const radius = length(sunUV);
      const disc = float(1).sub(smoothstep(0.29, 0.3, radius));
      const bloom = float(1).sub(smoothstep(0, 0.7, radius));
      const cut = clamp(
        sin(sunUV.y.add(time.mul(0.204)).mul(stripes))
          .mul(3)
          .add(clamp(sunUV.y.mul(14).add(1), -6, 6)),
        0,
        1,
      );
      const sunMask = clamp(disc.mul(cut), 0, 1).add(bloom.mul(0.6).mul(glow));
      col.assign(mix(vec3(1, 0.2, 1), vec3(1, 0.4, 0.1), sunUV.y.mul(2).add(0.2)).mul(sunMask));
      const mountain = trapezoid(p.add(vec2(-0.75, 0.5)), pow(p.y.mul(p.y), 2.1).add(1.75));
      const inside = step(mountain, 0);
      const wave = p.y.add(sin(p.x.mul(20).add(time.mul(2))).mul(snow)).add(0.2);
      col.assign(mix(col, mix(vec3(0, 0, 0.25), vec3(1, 0, 0.5), mountainGradient), inside));
      col.assign(mix(col, vec3(1, 0.5, 1), smoothstep(0, 0.01, wave).mul(inside)));
      col.assign(mix(col, vec3(1, 0.5, 1), float(1).sub(smoothstep(0, 0.01, abs(mountain)))));
      col.addAssign(
        mix(
          col,
          mix(vec3(1, 0.12, 0.8), vec3(0, 0, 0.2), clamp(p.y.mul(3).add(3), 0, 1)),
          step(0, mountain),
        ),
      );
      const cp = vec2(mod(p.x.add(time.mul(0.1)), 4).sub(2), p.y);
      const t = time.mul(0.5);
      const c1 = cloud(
        cp,
        vec2(sin(t.add(140.5)).mul(0.1).add(0.1), -0.5),
        vec2(cos(t.mul(0.9).sub(36.56)).mul(0.1).add(1.05), -0.5),
        vec2(cos(t.mul(0.867).add(387.165)).mul(0.1).add(0.2), -0.25),
        vec2(cos(t.mul(0.9675).sub(15.162)).mul(0.09).add(0.5), -0.25),
      );
      const c2 = cloud(
        cp,
        vec2(cos(t.mul(1.02).add(541.75)).mul(0.1).sub(0.9), -0.6),
        vec2(sin(t.mul(0.9).sub(316.56)).mul(0.1).sub(0.5), -0.6),
        vec2(cos(t.mul(0.867).add(37.165)).mul(0.1).sub(1.5), -0.35),
        vec2(sin(t.mul(0.9675).add(665.162)).mul(0.09).sub(0.6), -0.35),
      );
      const clouds = min(c1, c2);
      col.assign(mix(col, vec3(0, 0, 0.2), float(1).sub(smoothstep(0.0749, 0.075, clouds))));
      col.addAssign(
        vec3(1)
          .mul(float(1).sub(smoothstep(0, 0.01, abs(clouds.sub(0.075)))))
          .mul(glow),
      );
    });
    col.addAssign(pow(fog, 3).mul(glow));
    col.assign(mix(vec3(col.r).mul(0.5), col, 0.7));
    // Original display-referred RGB must be decoded before the runtime's sRGB output.
    return sRGBTransferEOTF(clamp(col, 0, 1)) as V3;
  })();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  return {
    material,
    controls: [
      {
        id: 'fuji-speed',
        kind: 'number',
        label: '流动速度',
        description: '改变网格前进、落日条纹和云朵的时间速度。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'fuji-density',
        kind: 'number',
        label: '网格密度',
        description: '改变透视平面上的网格数量。',
        min: 0.5,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: density,
      },
      {
        id: 'fuji-stripes',
        kind: 'number',
        label: '落日条纹',
        description: '改变落日遮罩的正弦频率。',
        min: 40,
        max: 160,
        step: 5,
        initial: 100,
        uniform: stripes,
      },
      {
        id: 'fuji-snow',
        kind: 'number',
        label: '雪线起伏',
        description: '改变山顶雪线波动幅度；零值显示水平雪线。',
        min: 0,
        max: 0.12,
        step: 0.01,
        initial: 0.05,
        uniform: snow,
      },
      {
        id: 'fuji-glow',
        kind: 'number',
        label: '霓虹辉光',
        description: '调节太阳、云边、网格和地平线的柔光。',
        min: 0,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: glow,
      },
    ],
  };
};
export default createShader;
