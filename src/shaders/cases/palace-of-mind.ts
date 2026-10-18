// Palace of Mind — butadiene (wttXDl).
// CC BY-NC-SA 3.0 based on the approved historical mirror. See case LICENSE.md.
// The original depth-like alpha is preserved in the snapshot; RGB is opaque here.
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
  sign,
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
type V3 = THREE.Node<'vec3'>;

const rotate = Fn(([p, angle]: [V2, F]) => {
  const c = cos(angle);
  const s = sin(angle);
  return vec2(p.x.mul(c).sub(p.y.mul(s)), p.x.mul(s).add(p.y.mul(c)));
}).setLayout({
  name: 'palaceRotate',
  type: 'vec2',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'angle', type: 'float' },
  ],
});

const hash = Fn(([p]: [V2]) => fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453))).setLayout(
  { name: 'palaceHash', type: 'float', inputs: [{ name: 'p', type: 'vec2' }] },
);

// A signed square cross-section, extruded along the missing coordinate.
const column = Fn(([p, width]: [V2, F]) => {
  const q = abs(p).toVar();
  const inside = max(vec2(width).sub(q), 0).toVar();
  return length(max(q.sub(width), 0)).sub(min(inside.x, inside.y));
}).setLayout({
  name: 'palaceColumn',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'width', type: 'float' },
  ],
});

// settings = (source time, column half-width, fold count). Pass state explicitly
// so the same field can be called by the march and four normal samples.
const field = Fn(([point, settings]: [V3, V3]) => {
  const cell = floor(point.sub(0.6).div(1.2)).mul(1.2).toVar();
  const seed = hash(cell.xz).toVar();
  const time = settings.x.mul(0.05).add(50).toVar();
  const drift = time
    .mul(sign(seed.sub(0.5)))
    .mul(seed.mul(0.5).add(0.7))
    .toVar();
  const p = point.toVar();
  p.xy.assign(rotate(p.xy, drift));
  p.z.addAssign(drift);
  p.assign(mod(p, 1.2).sub(0.6));
  p.mulAssign(7);
  p.yz.assign(rotate(p.yz, 0.76));
  Loop(5, ({ i }) => {
    If(float(i).greaterThanEqual(settings.z), () => {
      Break();
    });
    p.assign(
      abs(p)
        .sub(0.4)
        .add(
          seed
            .mul(0.1)
            .add(0.25)
            .mul(sin(time.mul(seed.add(0.5)))),
        ),
    );
    p.xy.assign(rotate(p.xy, time.mul(seed.add(0.7))));
    p.yz.assign(rotate(p.yz, time.mul(1.3).add(seed)));
  });
  return min(min(column(p.xy, settings.y), column(p.yz, settings.y)), column(p.zx, settings.y)).div(
    7,
  );
}).setLayout({
  name: 'palaceField',
  type: 'float',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'settings', type: 'vec3' },
  ],
});

const normal = Fn(([point, settings]: [V3, V3]) => {
  const k = vec2(1, -1);
  const gradient = k.xyy
    .mul(field(point.add(k.xyy.mul(0.001)), settings))
    .add(k.yyx.mul(field(point.add(k.yyx.mul(0.001)), settings)))
    .add(k.yxy.mul(field(point.add(k.yxy.mul(0.001)), settings)))
    .add(k.xxx.mul(field(point.add(k.xxx.mul(0.001)), settings)))
    .toVar();
  // A zero gradient has no defined normal; return zero instead of normalizing it.
  return gradient.div(max(length(gradient), 0.00000001));
}).setLayout({
  name: 'palaceNormal',
  type: 'vec3',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'settings', type: 'vec3' },
  ],
});

const lighting = Fn(([point, view, settings, emission]: [V3, V3, V3, F]) => {
  const n = normal(point, settings).toVar();
  const facing = clamp(dot(view.negate(), n), 0, 1).toVar();
  const light = normalize(vec3(-1, sin(settings.x.mul(0.5)).mul(0.9).sub(0.1), 0)).toVar();
  const diffuse = max(dot(light, n), 0).toVar();
  const reflected = normalize(light.negate().add(n.mul(diffuse).mul(2))).toVar();
  const specular = pow(max(dot(view.negate(), reflected), 0), 20)
    .mul(clamp(sign(diffuse), 0, 1))
    .toVar();
  const surface = vec3(1)
    .mul(pow(facing, 2).mul(0.9).add(specular.mul(0.3)))
    .toVar();
  const cell = floor(point.xz.sub(0.45).div(0.9)).mul(0.9).toVar();
  const sx = hash(cell).toVar();
  const sy = hash(cell.add(100.1)).toVar();
  const stripeDistance = abs(
    mod(
      abs(point.y.mul(sx).add(point.x.mul(sy))).add(settings.x.mul(sign(sx.sub(0.5))).mul(0.4)),
      0.5,
    ).sub(0.25),
  ).toVar();
  // The reciprocal tends to a saturated stripe at zero. Keep that finite limit.
  const stripe = clamp(float(0.001).div(max(stripeDistance, 0.000001)), 0, 1).toVar();
  return clamp(
    surface
      .mul(vec3(0.3, 0.5, 0.9))
      .mul(0.7)
      .add(vec3(0.2, 0.2, 1).mul(stripe).mul(emission)),
    0,
    1,
  );
}).setLayout({
  name: 'palaceLighting',
  type: 'vec3',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'view', type: 'vec3' },
    { name: 'settings', type: 'vec3' },
    { name: 'emission', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const width = uniform(0.06);
  const folds = uniform(4);
  const emission = uniform(1);
  const far = uniform(18);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(2);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const p = uv().mul(2).sub(1).toVar();
    p.x.mulAssign(resolution.x.div(resolution.y));
    const travel = vec3(0, 0, 1).mul(time).mul(0.3).toVar();
    const orbit = time.mul(0.3).toVar();
    const origin = vec3(cos(orbit), sin(orbit).mul(0.2), sin(orbit)).add(travel).toVar();
    const target = vec3(0).add(travel).toVar();
    const forward = normalize(target.sub(origin)).toVar();
    // The original cross-product basis is intentionally not renormalized.
    const side = cross(forward, vec3(0, 1, 0)).toVar();
    const up = cross(side, forward).toVar();
    const ray = normalize(side.mul(p.x).add(up.mul(p.y)).add(forward.mul(1.3))).toVar();
    const settings = vec3(time, width, folds).toVar();
    const distance = float(0.1).toVar();
    Loop(100, () => {
      const step = field(origin.add(ray.mul(distance)), settings).toVar();
      distance.addAssign(step);
      // Preserve signed stepping, update-before-break and the source's hit test.
      If(step.lessThan(0.0001), () => {
        Break();
      });
    });
    const color = mix(
      vec3(0.1, 0.1, 0.8),
      lighting(origin.add(ray.mul(distance)), ray, settings, emission),
      pow(clamp(far.sub(distance).div(far.sub(0.1)), 0, 1), 2),
    ).toVar();
    const displayRGB = clamp(pow(color, vec3(2.2)).mul(2), 0, 1);
    return sRGBTransferEOTF(displayRGB) as V3;
  })();
  return {
    material,
    controls: [
      {
        id: 'palace-speed',
        kind: 'number',
        label: '游走速度',
        description: '同时推进相机、空间折叠和光带；零值停在原作第 2 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'palace-width',
        kind: 'number',
        label: '梁柱半宽',
        description: '改变折叠空间中方柱的半宽，比较细梁与厚重交叉结构。',
        min: 0.025,
        max: 0.12,
        step: 0.005,
        initial: 0.06,
        uniform: width,
      },
      {
        id: 'palace-folds',
        kind: 'number',
        label: '折叠层数',
        description: '逐层加入绝对值折叠和旋转；四层对应原作。',
        min: 1,
        max: 5,
        step: 1,
        initial: 4,
        uniform: folds,
      },
      {
        id: 'palace-emission',
        kind: 'number',
        label: '条纹亮度',
        description: '零值关闭移动光带，单独观察梁柱表面的法线光照。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: emission,
      },
      {
        id: 'palace-far',
        kind: 'number',
        label: '远景深度',
        description: '改变表面颜色淡入蓝色远景的距离，不改变步进次数。',
        min: 8,
        max: 28,
        step: 1,
        initial: 18,
        uniform: far,
      },
    ],
  };
};

export default createShader;
