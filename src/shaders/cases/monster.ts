// MONSTER — butadiene (WtKSzt).
// CC BY-NC-SA 3.0, based on the explicitly approved historical mirror.
// Original RGB is presented opaquely; see the case LICENSE.md for evidence.
import * as THREE from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  abs,
  atan,
  clamp,
  cos,
  float,
  floor,
  length,
  max,
  min,
  mod,
  normalize,
  sRGBTransferEOTF,
  sin,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type F = THREE.Node<'float'>;
type V2 = THREE.Node<'vec2'>;
type V3 = THREE.Node<'vec3'>;

// The original is mat2(c,s,-s,c) * p: x'=cx-sy, y'=sx+cy.
const rotate = Fn(([point, angle]: [V2, F]) => {
  const c = cos(angle);
  const s = sin(angle);
  return vec2(point.x.mul(c).sub(point.y.mul(s)), point.x.mul(s).add(point.y.mul(c)));
}).setLayout({
  name: 'monsterRotate',
  type: 'vec2',
  inputs: [
    { name: 'point', type: 'vec2' },
    { name: 'angle', type: 'float' },
  ],
});

// settings = (time, sector count, fold count). Passing state explicitly keeps
// the field reusable inside the ray loop on both GPU backends.
const field = Fn(([point, settings]: [V3, V3]) => {
  const p = point.toVar();
  p.z.subAssign(settings.x);
  p.xy.assign(rotate(p.xy, p.z));
  const sector = float(Math.PI * 2).div(settings.y);
  const radius = length(p.xy).toVar();
  // atan(0,0) is undefined. Its angle cannot affect a zero-radius result.
  const angle = float(0).toVar();
  If(radius.greaterThan(0.00000001), () => {
    angle.assign(atan(p.x, p.y));
  });
  angle.assign(mod(angle.sub(sector.mul(0.5)), sector).sub(sector.mul(0.5)));
  p.xy.assign(vec2(cos(angle), sin(angle)).mul(radius));
  const cell = floor(p.z.mul(0.7)).toVar();
  p.assign(mod(p, 0.7).sub(0.35));
  Loop(6, ({ i }) => {
    If(float(i).lessThan(settings.z), () => {
      p.assign(abs(p).sub(0.3));
      p.xy.assign(rotate(p.xy, cell.add(1).add(settings.x.mul(0.1))));
      p.xz.assign(rotate(p.xz, cell.mul(4.7).add(1).add(settings.x.mul(0.3))));
    });
  });
  const q = abs(p).toVar();
  const inside = max(vec3(0.3).sub(q), 0);
  const box = length(max(q.sub(0.3), 0)).sub(min(min(inside.x, inside.y), inside.z));
  return min(box, length(p).sub(0.4));
}).setLayout({
  name: 'monsterField',
  type: 'float',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'settings', type: 'vec3' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const sectors = uniform(6);
  const folds = uniform(4);
  const proximity = uniform(1);
  const sliceStrength = uniform(1);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(2);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const screen = uv().mul(2).sub(1).toVar();
    screen.y.mulAssign(resolution.y.div(resolution.x));
    screen.assign(rotate(screen, time));
    const origin = vec3(0, 0, 0.1);
    const ray = normalize(vec3(screen, 0).sub(origin));
    const travel = float(2).toVar();
    const accumulated = float(0).toVar();
    const settings = vec3(time, sectors, folds);
    Loop(66, () => {
      const distance = abs(field(origin.add(ray.mul(travel)), settings).mul(0.2)).toVar();
      travel.addAssign(distance);
      // Preserve the source's fixed traversal and possible zero steps. This
      // counts near-surface samples rather than stopping at the first hit.
      If(distance.lessThan(proximity.mul(0.001)), () => {
        accumulated.addAssign(0.1);
      });
    });
    const position = origin.add(ray.mul(travel));
    const slice = mod(position.z.sub(time.mul(1.5)), 0.5)
      .sub(0.25)
      .toVar();
    // For 0 < slice <= .0001 the original clamps to 100 already. At exactly
    // zero use that positive-side limit, avoiding a backend-dependent 1/0.
    const emission = slice
      .greaterThanEqual(0)
      .select(min(float(0.01).div(max(slice, 0.0001)), 100), 0);
    const rgb = vec3(0.1, 0.7, 0.7)
      .mul(0.2)
      .mul(accumulated)
      .add(vec3(0.1, 1, 0.1).mul(emission).mul(3).mul(sliceStrength));
    // Original alpha=0 is ignored by the opaque shader view. Decode its
    // display RGB once before the shared renderer's sRGB output conversion.
    return sRGBTransferEOTF(clamp(rgb, 0, 1)) as V3;
  })();
  return {
    material,
    controls: [
      {
        id: 'monster-speed',
        kind: 'number',
        label: '流动速度',
        description: '统一改变旋转、折叠和光片的时间倍率；零值停在原作第 2 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'monster-sectors',
        kind: 'number',
        label: '旋转分区',
        description: '把平面折回同一个角扇区，改变环绕中心的重复数量。',
        min: 3,
        max: 10,
        step: 1,
        initial: 6,
        uniform: sectors,
      },
      {
        id: 'monster-folds',
        kind: 'number',
        label: '折叠次数',
        description: '改变绝对值折叠与旋转的层数；原作为四层。',
        min: 2,
        max: 6,
        step: 1,
        initial: 4,
        uniform: folds,
      },
      {
        id: 'monster-proximity',
        kind: 'number',
        label: '近表面光厚',
        description: '放大计入青色光的距离阈值，不改变推进步长。',
        min: 0.5,
        max: 4,
        step: 0.1,
        initial: 1,
        uniform: proximity,
      },
      {
        id: 'monster-slice',
        kind: 'number',
        label: '绿色光片',
        description: '改变独立绿色切片的亮度；设为零可单独观察青色结构。',
        min: 0,
        max: 2,
        step: 0.1,
        initial: 1,
        uniform: sliceStrength,
      },
    ],
  };
};

export default createShader;
