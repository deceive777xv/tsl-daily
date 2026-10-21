/*
 * M-O (from Wall-E) — dean_the_coder / @deanthecoder (WdVfRc), 2020.
 * CC BY-NC-SA 3.0, including this TSL adaptation. See the case LICENSE.md.
 * A tribute to Pixar's M-O; source acknowledgments remain in original.glsl.
 */
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
  reflect,
  sin,
  smoothstep,
  sqrt,
  step,
  sRGBTransferEOTF,
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
const pointMotion = [
  { name: 'point', type: 'vec3' },
  { name: 'motion', type: 'vec2' },
];

// GLSL uses a row vector p *= mat2(c,s,-s,c), so preserve that orientation.
const rotate = Fn(([p, angle]: [V2, F]) => {
  const c = cos(angle),
    s = sin(angle);
  return vec2(p.x.mul(c).add(p.y.mul(s)), p.y.mul(c).sub(p.x.mul(s)));
}).setLayout({
  name: 'moRotate',
  type: 'vec2',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'angle', type: 'float' },
  ],
});

const noise = Fn(([point]: [V2]) => {
  const cell = floor(point).toVar();
  const f = fract(point).toVar();
  f.assign(f.mul(f).mul(vec2(3).sub(f.mul(2))));
  const h = vec2(0, 157)
    .add(dot(cell, vec2(7, 157)))
    .toVar();
  h.assign(mix(fract(sin(h).mul(43.5453)), fract(sin(h.add(7)).mul(43.5453)), f.x));
  return mix(h.x, h.y, f.y);
}).setLayout({ name: 'moNoise', type: 'float', inputs: [{ name: 'point', type: 'vec2' }] });

const box = Fn(([p, size]: [V3, V3]) => {
  const q = abs(p).sub(size).toVar();
  return length(max(q, 0)).add(min(max(q.x, max(q.y, q.z)), 0));
}).setLayout({
  name: 'moBox',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'size', type: 'vec3' },
  ],
});

const cylinder = Fn(([p, size]: [V3, V2]) => {
  const d = abs(vec2(length(p.zy), p.x))
    .sub(size)
    .toVar();
  return min(max(d.x, d.y), 0).add(length(max(d, 0)));
}).setLayout({
  name: 'moCylinder',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'size', type: 'vec2' },
  ],
});

const taper = Fn(([point, radii]: [V2, V3]) => {
  const p = vec2(abs(point.x), point.y.negate()).toVar();
  const b = radii.x.sub(radii.y).div(radii.z).toVar();
  const a = sqrt(max(float(1).sub(b.mul(b)), 0)).toVar();
  const k = dot(p, vec2(b.negate(), a)).toVar();
  const d = k
    .lessThan(0)
    .select(length(p), dot(p, vec2(a, b)))
    .sub(radii.x)
    .toVar();
  If(k.greaterThan(a.mul(radii.z)), () => {
    d.assign(length(p.sub(vec2(0, radii.z))).sub(radii.y));
  });
  return d;
}).setLayout({
  name: 'moTaper',
  type: 'float',
  inputs: [
    { name: 'point', type: 'vec2' },
    { name: 'radii', type: 'vec3' },
  ],
});

const arm = Fn(([p, cut]: [V3, F]) =>
  max(
    max(taper(p.yz, vec3(0.5, 0.2, 2)), abs(abs(p.x).sub(1.55))).sub(0.1),
    p.z
      .add(1.5)
      .add(sin(p.y.mul(7)).mul(0.1))
      .mul(cut),
  ),
).setLayout({
  name: 'moArm',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'cut', type: 'float' },
  ],
});

const track = Fn(([z, time]: [F, F]) => sin(z.mul(0.2).sub(time))).setLayout({
  name: 'moTrack',
  type: 'float',
  inputs: [
    { name: 'z', type: 'float' },
    { name: 'time', type: 'float' },
  ],
});

const lightDistance = Fn(([p, time]: [V3, F]) =>
  box(vec3(p.xy, mod(p.z.sub(time.mul(8)), 40)).sub(vec3(20, 7.25, 20)), vec3(0.1, 0.1, 8)),
).setLayout({
  name: 'moLightDistance',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'time', type: 'float' },
  ],
});

// A pure contribution replaces map()'s implicit global g side effect.
const glowAt = Fn(([p, time]: [V3, F]) => {
  const d = lightDistance(p, time).toVar();
  return float(0.01).div(d.mul(d).add(0.01));
}).setLayout({
  name: 'moGlowAt',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'time', type: 'float' },
  ],
});

// Hit is packed as (distance, material ID, local texture u, local texture v).
// motion = (source time after its initial delay, articulated arm angle).
const field = Fn(([point, motion]: [V3, V2]) => {
  const p = point.toVar();
  const hit = vec4(abs(p.y), 1, p.xz).toVar();
  const take = (distance: F, id: number, texturePoint: V2) => {
    const candidate = vec4(distance, id, texturePoint).toVar();
    If(candidate.x.lessThan(hit.x), () => {
      hit.assign(candidate);
    });
  };
  take(min(dot(p, vec3(-0.707, 0.707, 0)).add(9), dot(p, vec3(-1, 0, 0)).add(20)), 0, p.yz);
  take(lightDistance(p, motion.x).sub(0.7), 4, p.xy);
  p.x.addAssign(track(-0.9, motion.x));
  p.xz.assign(rotate(p.xz, track(7, motion.x).mul(0.2)));
  take(length(p.sub(vec3(0, 1, 0))).sub(1), 2, p.xy);
  p.yz.assign(rotate(p.yz, motion.y.negate()));
  p.y.subAssign(1.7);
  take(box(p, vec3(1.2, 0.9, cos(p.y.add(5.1).mul(1.33)).mul(0.5).add(0.8))).sub(0.2), 3, p.xy);
  const bodyPoint = p.toVar();
  p.y.subAssign(0.5);
  p.yz.assign(rotate(p.yz, motion.y.negate()));
  const firstArm = arm(p, -1).toVar();
  p.z.addAssign(motion.y.add(cos(motion.x.mul(15)).mul(0.1)));
  take(min(firstArm, arm(p, 1)), 0, bodyPoint.xy);
  const brushRidge = abs(sin(p.x.mul(18)))
    .mul(0.08)
    .add(0.2)
    .toVar();
  take(cylinder(p.add(vec3(0, 0, 2)), vec2(brushRidge.add(0.1), 1.4)), 2, p.xy);
  p.x.assign(abs(p.x).sub(1.55));
  p.z.addAssign(1);
  take(box(p, vec3(0.08, 0.22, 0.6)), 2, p.xz);
  p.assign(bodyPoint);
  p.yz.assign(rotate(p.yz, motion.y.mul(-0.7)));
  p.xz.assign(rotate(p.xz, track(0, motion.x).mul(0.1)));
  p.y.subAssign(2);
  p.z.addAssign(0.5);
  const curve = cos(p.y.add(0.8)).toVar();
  take(
    max(
      box(p, vec3(mix(1.2, 1.4, curve), 0.8, mix(0.9, 1.2, curve))),
      float(2.5).sub(length(p.yz.add(vec2(2.5, -0.8)))),
    ).sub(0.2),
    6,
    p.xy,
  );
  p.y.subAssign(mix(0.96, 2.5, motion.y));
  take(box(p, vec3(0.5, 0.04, 0.5)), 3, p.xy);
  take(box(p.add(vec3(0, 0.3, 0)), vec3(0.45, 0.3, 0.45)), 5, p.xy);
  return hit;
}).setLayout({ name: 'moField', type: 'vec4', inputs: pointMotion });

// Return the normal and all four map evaluations' glow contribution.
const normal = Fn(([point, motion]: [V3, V2]) => {
  const e = vec2(0.024, -0.024);
  const a = point.add(e.xyy).toVar(),
    b = point.add(e.yyx).toVar();
  const c = point.add(e.yxy).toVar(),
    d = point.add(e.xxx).toVar();
  const gradient = e.xyy
    .mul(field(a, motion).x)
    .add(e.yyx.mul(field(b, motion).x))
    .add(e.yxy.mul(field(c, motion).x))
    .add(e.xxx.mul(field(d, motion).x))
    .toVar();
  const glow = glowAt(a, motion.x)
    .add(glowAt(b, motion.x))
    .add(glowAt(c, motion.x))
    .add(glowAt(d, motion.x));
  return vec4(gradient.div(max(length(gradient), 0.00000001)), glow);
}).setLayout({ name: 'moNormal', type: 'vec4', inputs: pointMotion });

const shadow = Fn(([point, light, motion]: [V3, V3, V2]) => {
  const shade = float(1).toVar(),
    travel = float(0.1).toVar(),
    glow = float(0).toVar();
  Loop(20, () => {
    const p = point.add(light.mul(travel)).toVar();
    const d = field(p, motion).x.toVar();
    glow.addAssign(glowAt(p, motion.x));
    shade.assign(min(shade, d.mul(15).div(max(abs(travel), 0.000001))));
    travel.addAssign(d);
    If(shade.lessThan(0.001).or(travel.greaterThan(2.7)), () => {
      Break();
    });
  });
  return vec2(clamp(shade, 0, 1), glow);
}).setLayout({
  name: 'moShadow',
  type: 'vec2',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'light', type: 'vec3' },
    { name: 'motion', type: 'vec2' },
  ],
});

const floorDetail = Fn(([p]: [V2]) =>
  noise(vec2(p.x.mul(1.2), p.y))
    .mul(0.3)
    .add(smoothstep(0, 0.04, abs(sin(p.mul(0.5))))),
).setLayout({ name: 'moFloorDetail', type: 'vec2', inputs: [{ name: 'p', type: 'vec2' }] });

const surface = Fn(([hit, point, motion]: [V4, V3, V2]) => {
  const color = vec3(1).toVar();
  If(hit.y.equal(1), () => {
    const t = hit.zw.add(vec2(track(point.z, motion.x), motion.x.mul(-5))).toVar();
    const dirt = noise(mod(t.mul(10), 20)).toVar();
    const edge = abs(vec2(abs(abs(t.x).sub(0.8)).sub(0.3), mod(t.y, 0.4).sub(0.1))).sub(
      vec2(0.2, 0.1),
    );
    const mask = float(1)
      .sub(step(0, min(max(edge.x, edge.y), 0)))
      .mul(step(point.z, -2.5));
    color.assign(vec3(0.3, 0.4, 0.5).mul(mix(1, dirt, mask)));
  });
  If(hit.y.equal(2), () => {
    color.assign(vec3(0.1));
  });
  If(hit.y.equal(3), () => {
    color.assign(vec3(float(1).sub(step(abs(hit.w.add(0.7)), 0.15).mul(0.9))));
  });
  If(hit.y.equal(4), () => {
    color.assign(vec3(25));
  });
  If(hit.y.equal(5), () => {
    color.assign(vec3(1, 0, 0));
  });
  If(hit.y.equal(6), () => {
    const t = vec2(abs(hit.z), hit.w).toVar();
    If(t.y.lessThan(-0.3).and(t.x.lessThan(1)), () => {
      t.x.addAssign(motion.y.mul(0.4));
      const stripe = abs(sin(t.y.mul(50)))
        .mul(0.7)
        .add(0.3)
        .toVar();
      t.assign(rotate(t, motion.y.mul(0.6)));
      color.assign(
        vec3(0.01).add(
          vec3(1.5, 1.5, 0)
            .mul(step(abs(t.x.sub(0.3)), 0.25))
            .mul(step(abs(t.y.add(0.7)), float(0.1).sub(motion.y.mul(0.1))))
            .mul(stripe),
        ),
      );
    });
  });
  return color;
}).setLayout({
  name: 'moSurface',
  type: 'vec3',
  inputs: [{ name: 'hit', type: 'vec4' }, ...pointMotion],
});

const lighting = Fn(([point, ray, hit, motion, shadowStrength]: [V3, V3, V4, V2, F]) => {
  const normalSample = normal(point, motion).toVar();
  const n = normalSample.xyz.toVar();
  const light = normalize(vec3(6, 3, -10).sub(point)).toVar();
  const color = surface(hit, point, motion).toVar();
  If(hit.y.equal(1), () => {
    n.xz.addAssign(floorDetail(vec2(hit.z, hit.w.sub(motion.x.mul(5)))));
    n.assign(n.div(max(length(n), 0.00000001)));
  });
  const shade = shadow(point, light, motion).toVar();
  const closePoint = point.add(n.mul(0.3)).toVar(),
    farPoint = point.add(n.mul(2)).toVar();
  const occlusion = mix(
    field(closePoint, motion).x.div(0.3),
    field(farPoint, motion).x.div(2),
    0.7,
  ).toVar();
  const diffuse = max(0, dot(light, n).mul(0.9).add(0.1)).add(
    max(
      0,
      dot(light.mul(vec3(-1, 0, -1)), n)
        .mul(0.9)
        .add(0.1),
    ),
  );
  const specular = pow(max(0, dot(ray, reflect(light, n))), 30);
  const shaded = color
    .mul(
      diffuse
        .mul(mix(1, mix(0.3, 0.6, shade.x), shadowStrength))
        .mul(occlusion)
        .add(specular),
    )
    .mul(vec3(2, 1.8, 1.7));
  const glow = normalSample.w
    .add(shade.y)
    .add(glowAt(closePoint, motion.x))
    .add(glowAt(farPoint, motion.x));
  return vec4(shaded, glow);
}).setLayout({
  name: 'moLighting',
  type: 'vec4',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'ray', type: 'vec3' },
    { name: 'hit', type: 'vec4' },
    { name: 'motion', type: 'vec2' },
    { name: 'shadowStrength', type: 'float' },
  ],
});

// Return RGB plus the cumulative glow, including the reflected ray. The latter
// is deliberately carried into the next AA sample, just as in the source.
const march = Fn(([origin, direction, motion, settings, previousGlow]: [V3, V3, V2, V2, F]) => {
  const p = origin.toVar(),
    ray = direction.toVar(),
    ro = origin.toVar();
  const travel = float(0.01).toVar(),
    hit = vec4(0).toVar(),
    glow = previousGlow.toVar();
  Loop(110, () => {
    p.assign(ro.add(ray.mul(travel)));
    hit.assign(field(p, motion));
    glow.addAssign(glowAt(p, motion.x));
    If(abs(hit.x).lessThan(0.0015), () => {
      Break();
    });
    travel.addAssign(hit.x);
  });
  const lit = lighting(p, ray, hit, motion, settings.x).toVar();
  glow.addAssign(lit.w);
  const color = lit.xyz.add(glow).toVar();
  If(hit.y.equal(1), () => {
    const sampledNormal = normal(p, motion).toVar();
    glow.addAssign(sampledNormal.w);
    const n = sampledNormal.xyz.toVar();
    n.xz.subAssign(floorDetail(p.xz.sub(vec2(0, motion.x.mul(5)))).mul(0.024));
    ray.assign(reflect(ray, n.div(max(length(n), 0.00000001))));
    travel.assign(0.5);
    ro.assign(p);
    Loop(90, () => {
      p.assign(ro.add(ray.mul(travel)));
      hit.assign(field(p, motion));
      glow.addAssign(glowAt(p, motion.x));
      If(abs(hit.x).lessThan(0.0015), () => {
        Break();
      });
      travel.addAssign(hit.x);
    });
    If(abs(hit.x).lessThan(0.0015), () => {
      color.assign(mix(color, surface(hit, p, motion), settings.y));
    });
  });
  return vec4(color, glow);
}).setLayout({
  name: 'moMarch',
  type: 'vec4',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'motion', type: 'vec2' },
    { name: 'settings', type: 'vec2' },
    { name: 'previousGlow', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    pose = uniform(1),
    shadowStrength = uniform(1);
  const reflection = uniform(0.01),
    framing = uniform(1);
  const elapsed = float(context.time as unknown as number)
    .mul(speed)
    .add(2);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const phase = mod(elapsed, 30).sub(1).toVar();
    const arms = phase
      .lessThan(0)
      .select(smoothstep(-1, 0, phase), abs(sin(phase.mul(10)).mul(0.1)).add(0.9))
      .mul(0.38)
      .mul(pose)
      .toVar();
    const time = max(0, phase).toVar();
    const motion = vec2(time, arms).toVar();
    const origin = vec3(-7, 4, sin(time.mul(0.3)).negate().sub(7)).toVar();
    const forward = normalize(vec3(0, 3, -4).sub(origin)).toVar();
    const right = normalize(cross(vec3(0, 1, 0), forward)).toVar();
    const color = vec3(0).toVar(),
      glow = float(0).toVar();
    const aspect = resolution.x.div(resolution.y).toVar();
    const portraitFit = max(1, float(1).div(aspect));
    const portraitPan = clamp(float(1).sub(aspect).mul(2), 0, 1).mul(0.25);
    // Four source subpixel samples; keep loop order and cross-sample glow state.
    Loop(2, ({ i }) => {
      Loop(2, ({ i: j }) => {
        const screen = uv()
          .mul(resolution)
          .add(vec2(float(i), float(j)).mul(0.5))
          .sub(resolution.mul(0.5))
          .div(resolution.y)
          .mul(framing)
          .toVar();
        // Keep the assembled character visible in a narrow portrait canvas.
        screen.mulAssign(portraitFit);
        screen.x.subAssign(portraitPan);
        const ray = normalize(
          forward.add(right.mul(screen.x)).add(cross(forward, right).mul(screen.y)),
        ).toVar();
        const sample = march(origin, ray, motion, vec2(shadowStrength, reflection), glow).toVar();
        color.addAssign(sample.xyz);
        glow.assign(sample.w);
      });
    });
    color.divAssign(4);
    const q = uv();
    const vignette = pow(q.x.mul(q.y).mul(float(1).sub(q.x)).mul(float(1).sub(q.y)).mul(16), 0.4)
      .mul(0.5)
      .add(0.5);
    const displayRGB = clamp(pow(max(color, 0), vec3(0.45)).mul(vignette), 0, 1);
    return sRGBTransferEOTF(displayRGB) as V3;
  })();
  return {
    material,
    controls: [
      {
        id: 'mo-speed',
        kind: 'number',
        label: '清扫速度',
        description: '同步推进行进、刷头与头部动作；零值停在原作第 2 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'mo-pose',
        kind: 'number',
        label: '关节幅度',
        description: '缩放躯干、手臂与头部的关节角度，观察局部坐标如何传递动作。',
        min: 0,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: pose,
      },
      {
        id: 'mo-shadow',
        kind: 'number',
        label: '软阴影浓度',
        description: '比较关闭与开启软阴影的体积感；环境遮蔽仍保持原作设置。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 1,
        uniform: shadowStrength,
      },
      {
        id: 'mo-reflection',
        kind: 'number',
        label: '地面反射',
        description: '缩放第二条射线取得的材质混合比例；原作仅使用百分之一。',
        min: 0,
        max: 0.12,
        step: 0.005,
        initial: 0.01,
        uniform: reflection,
      },
      {
        id: 'mo-framing',
        kind: 'number',
        label: '取景范围',
        description: '数值越大视野越宽，适合比较角色整体与零件细节。',
        min: 0.75,
        max: 1.4,
        step: 0.05,
        initial: 1,
        uniform: framing,
      },
    ],
  };
};
export default createShader;
