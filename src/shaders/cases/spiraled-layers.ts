// Spiraled Layers — Tater (Ns3XWf).
// CC BY-NC-SA 3.0 under the approved historical Shadertoy default-license evidence.
// See the case LICENSE.md for the original snapshot and adaptation notes.
import * as THREE from 'three/webgpu';
import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  atan,
  clamp,
  cos,
  cross,
  float,
  floor,
  fract,
  length,
  max,
  min,
  mix,
  normalize,
  round,
  sRGBTransferEOTF,
  sign,
  sin,
  smoothstep,
  sqrt,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type F = THREE.Node<'float'>;
type V2 = THREE.Node<'vec2'>;
type V3 = THREE.Node<'vec3'>;
type V4 = THREE.Node<'vec4'>;
const PI = Math.PI;

// The GLSL uses row-vector multiplication: p * mat2(c,s,-s,c).
const rotate = Fn(([p, angle]: [V2, F]) => {
  const c = cos(angle),
    s = sin(angle);
  return vec2(p.x.mul(c).add(p.y.mul(s)), p.y.mul(c).sub(p.x.mul(s)));
}).setLayout({
  name: 'spiralRotate',
  type: 'vec2',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'angle', type: 'float' },
  ],
});

const hash = Fn(([a]: [F]) => {
  const shifted = a.add(0.65343);
  return fract(fract(shifted.mul(shifted).mul(12.9898)).mul(43758.5453123));
}).setLayout({ name: 'spiralHash', type: 'float', inputs: [{ name: 'a', type: 'float' }] });

// The original ext() extrudes a 2D distance along the lane's Z interval.
const extrude = Fn(([p, distance, halfWidth]: [V3, F, F]) => {
  const b = vec2(distance, abs(p.y).sub(halfWidth));
  return min(max(b.x, b.y), 0).add(length(max(b, 0)));
}).setLayout({
  name: 'spiralExtrude',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'distance', type: 'float' },
    { name: 'halfWidth', type: 'float' },
  ],
});

// One unrolling coil in the XY plane. The source's initial X offset simplifies
// exactly from pi*(-t)*(m+m*(-t-1)) to pi*m*t*t after clamping t to zero.
const spiral = Fn(([position, time, period, spacing, size]: [V2, F, F, F, F]) => {
  const p = position.toVar();
  const t = max(time, 0).toVar();
  const thickness = size.sub(0.04).add(0.01);
  p.x.addAssign(float(PI).mul(period).mul(t.mul(t)));
  t.subAssign(0.25);
  const original = p.toVar();
  p.y.subAssign(t.mul(period).add(period.mul(0.5)));
  p.assign(rotate(p, t.mul(2 * PI).add(PI / 2)));
  const angle = clamp(atan(p.y, p.x), -PI, PI);
  p.assign(vec2(angle, length(p).add(angle.mul(spacing).mul(0.5))));
  const unrolledY = p.y.toVar();
  const cell = clamp(round(p.y.div(period)), 0, floor(t));
  p.y.subAssign(period.mul(cell));
  const distance = abs(p.y).sub(thickness).toVar();
  p.y.assign(unrolledY.sub(floor(t).add(1).mul(period)));
  p.x.subAssign(PI);
  const movingEnd = max(
    abs(p.y),
    abs(p.x)
      .sub(float(2 * PI).mul(fract(t)))
      .add(thickness),
  );
  distance.assign(min(distance, movingEnd.sub(thickness)));
  const flatEnd = max(original.x.mul(30), abs(original.y).sub(thickness));
  return min(distance, flatEnd);
}).setLayout({
  name: 'spiralCoil',
  type: 'float',
  inputs: [
    { name: 'position', type: 'vec2' },
    { name: 'time', type: 'float' },
    { name: 'period', type: 'float' },
    { name: 'spacing', type: 'float' },
    { name: 'size', type: 'float' },
  ],
});

// Three phase-shifted rolls stack in each repeated lane.
const coilSample = Fn(([base, time, size, index]: [V3, F, F, F]) => {
  const p = base.toVar();
  const t = time.sub(index.mul(10 / 3)).toVar();
  const rowHeight = size.mul(6);
  const spacing = size.sub(0.01);
  const period = float(PI).mul(spacing);
  p.y.addAssign(size.mul(index).mul(2));
  const lastRow = floor(t.div(10)).negate();
  const row = min(round(p.y.div(rowHeight)), lastRow);
  t.addAssign(row.mul(10));
  p.y.subAssign(rowHeight.mul(row));
  const raw = spiral(p.xy, t, period, spacing, size);
  const clipped = min(raw, max(p.y.add(size.mul(5)), p.x));
  return vec2(clipped, raw);
}).setLayout({
  name: 'spiralCoilSample',
  type: 'vec2',
  inputs: [
    { name: 'base', type: 'vec3' },
    { name: 'time', type: 'float' },
    { name: 'size', type: 'float' },
    { name: 'index', type: 'float' },
  ],
});

// settings = (coil size, lane half-width, lane count, source time).
// Returns (surface distance, 1 for a coil / 0 for a repetition plane, AO distance).
const field = Fn(([point, direction, settings]: [V3, V3, V4]) => {
  const size = settings.x,
    width = settings.y,
    count = settings.z;
  const p = point.toVar();
  p.y.subAssign(settings.w.mul(size).mul(0.6));
  p.x.subAssign(3);
  const lanePeriod = width.mul(2).add(0.1);
  const lane = clamp(round(p.z.div(lanePeriod)), count.negate(), count);
  const time = settings.w.add(hash(lane.mul(0.76)).mul(8));
  p.z.subAssign(lanePeriod.mul(lane));
  const surface = float(1e6).toVar(),
    uncut = float(1e6).toVar();
  Loop(3, ({ i }) => {
    const sample = coilSample(p, time, size, float(i));
    surface.assign(min(surface, sample.x));
    uncut.assign(min(uncut, sample.y));
  });
  const halfWidth = width.sub(0.04 * 0.5).add(0.02);
  const distance = extrude(p.yzx, surface, halfWidth).sub(0.04);
  const aoDistance = extrude(p.yzx, uncut, halfWidth).sub(0.04);
  // Ray/plane intersection bounds the repeated cell and hides its seams.
  const plane = sign(direction.z).mul(lanePeriod.mul(0.5)).sub(p.z).div(direction.z).add(0.01);
  return vec3(min(distance, plane), selectCoil(distance, plane), aoDistance);
}).setLayout({
  name: 'spiralField',
  type: 'vec3',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'settings', type: 'vec4' },
  ],
});

// A small separate function keeps the conditional material flag portable.
const selectCoil = Fn(([surface, plane]: [F, F]) => {
  const flag = float(0).toVar();
  If(surface.lessThan(plane), () => {
    flag.assign(1);
  });
  return flag;
}).setLayout({
  name: 'spiralSelectCoil',
  type: 'float',
  inputs: [
    { name: 'surface', type: 'float' },
    { name: 'plane', type: 'float' },
  ],
});

const normalAt = Fn(([point, direction, settings]: [V3, V3, V4]) => {
  const center = field(point, direction, settings).x;
  const e = float(0.01);
  return normalize(
    vec3(
      center.sub(field(point.sub(vec3(e, 0, 0)), direction, settings).x),
      center.sub(field(point.sub(vec3(0, e, 0)), direction, settings).x),
      center.sub(field(point.sub(vec3(0, 0, e)), direction, settings).x),
    ),
  );
}).setLayout({
  name: 'spiralNormal',
  type: 'vec3',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'settings', type: 'vec4' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    size = uniform(0.062),
    width = uniform(0.5),
    yaw = uniform(0.09);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(2);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const screen = uv().sub(0.5).mul(resolution.div(resolution.y));
    const origin = vec3(5, 1.8, -12).mul(1.2).toVar();
    origin.zx.assign(rotate(origin.zx, yaw));
    const forward = normalize(vec3(-2.5, 0, 0).sub(origin));
    const right = normalize(cross(vec3(0, 1, 0), forward));
    const ray = normalize(
      forward.mul(2).add(right.mul(screen.x)).add(cross(forward, right).mul(screen.y)),
    );
    const settings = vec4(size, width, 6, time);
    const travel = float(0).toVar();
    const point = origin.toVar();
    const hit = float(0).toVar();
    const sample = vec3(0).toVar();
    Loop(128, () => {
      point.assign(origin.add(ray.mul(travel)));
      sample.assign(field(point, ray, settings));
      travel.addAssign(sample.x);
      If(sample.x.lessThan(0.001), () => {
        hit.assign(1);
        Break();
      });
      If(travel.greaterThan(100), () => {
        Break();
      });
    });
    const sky = mix(
      vec3(0.355, 0.129, 0.894),
      vec3(0.278, 0.953, 1),
      clamp(ray.y.add(0.05).mul(2), -0.15, 1.5),
    );
    const color = sky.toVar();
    If(hit.greaterThan(0), () => {
      If(sample.y.greaterThan(0.5), () => {
        const light = normalize(vec3(0.5, 0.4, 0.9));
        const normal = normalAt(point, ray, settings).toVar();
        const shadow = float(1).toVar();
        const depth = float(0.09).toVar();
        Loop(24, () => {
          const probe = field(point.add(light.mul(depth)).add(normal.mul(0.005)), light, settings);
          If(probe.x.lessThan(0.001), () => {
            If(probe.y.greaterThan(0.5), () => {
              shadow.assign(0);
            });
            Break();
          });
          shadow.assign(min(shadow, probe.z.mul(30)));
          If(depth.greaterThan(7), () => {
            Break();
          });
          depth.addAssign(max(probe.x, 0.01));
        });
        shadow.assign(max(shadow, 0.8));
        // The brighter floor compensates for shortened trace/shadow budgets on side faces.
        const ao = max(
          smoothstep(-0.05, 0.05, field(point.add(normal.mul(0.05)), light, settings).z).mul(
            smoothstep(-0.1, 0.1, field(point.add(normal.mul(0.1)), light, settings).z),
          ),
          0.65,
        );
        normal.xz.assign(rotate(normal.xz, (4 * PI) / 3));
        color.assign(normal.mul(0.5).add(0.5).mul(shadow).mul(ao));
      });
    });
    // The original writes alpha=0; the site deliberately displays opaque RGB.
    return sRGBTransferEOTF(clamp(sqrt(color), 0, 1)) as V3;
  })();
  return {
    material,
    controls: [
      {
        id: 'spiral-speed',
        kind: 'number',
        label: '展开速度',
        description: '改变卷层展开和纵向移动的时间倍率；零值停在第 2 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'spiral-size',
        kind: 'number',
        label: '卷层厚度',
        description: '改变螺旋距离场的笔画宽度，也影响相邻卷层的高度。',
        min: 0.045,
        max: 0.09,
        step: 0.001,
        initial: 0.062,
        uniform: size,
      },
      {
        id: 'spiral-width',
        kind: 'number',
        label: '分层宽度',
        description: '调整重复层的横向间距与空间裁切边界。',
        min: 0.3,
        max: 0.8,
        step: 0.01,
        initial: 0.5,
        uniform: width,
      },
      {
        id: 'spiral-yaw',
        kind: 'number',
        label: '相机偏航',
        description: '旋转相机起点，观察卷层在三维空间的排列。',
        min: -0.2,
        max: 0.4,
        step: 0.01,
        initial: 0.09,
        uniform: yaw,
      },
    ],
  };
};

export default createShader;
