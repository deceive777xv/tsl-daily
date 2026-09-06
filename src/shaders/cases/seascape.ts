// "Seascape" by Alexander Alekseev aka TDM — CC BY-NC-SA 3.0 Unported.
// TSL adaptation of the approved Ms2SD1 historical mirror; see its LICENSE.md.
import * as THREE from 'three/webgpu';
import {
  Break,
  Fn,
  If,
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
  min,
  mix,
  normalize,
  pow,
  reflect,
  sin,
  smoothstep,
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

const noise = Fn(([p]: [V2]) => {
  const i = floor(p);
  const f = fract(p);
  const u = f.mul(f).mul(float(3).sub(f.mul(2)));
  const hash = (v: V2) => fract(sin(dot(v, vec2(127.1, 311.7))).mul(43758.5453123));
  return mix(
    mix(hash(i), hash(i.add(vec2(1, 0))), u.x),
    mix(hash(i.add(vec2(0, 1))), hash(i.add(1)), u.x),
    u.y,
  )
    .mul(2)
    .sub(1);
}).setLayout({ name: 'seascapeNoise', type: 'float', inputs: [{ name: 'p', type: 'vec2' }] });

const octave = Fn(([p, choppy]: [V2, F]) => {
  const q = p.add(noise(p));
  const wave = vec2(1).sub(abs(sin(q)));
  const smoothWave = abs(cos(q));
  const shaped = vec2(mix(wave.x, smoothWave.x, wave.x), mix(wave.y, smoothWave.y, wave.y));
  return pow(max(float(1).sub(pow(shaped.x.mul(shaped.y), 0.65)), 0), choppy);
}).setLayout({
  name: 'seascapeOctave',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'choppy', type: 'float' },
  ],
});

// settings = (wave time, wave height, peak sharpness, base frequency).
// Intersection needs 3 octaves; normal estimation needs 5, preserving TDM's split.
const heightField = (iterations: number) =>
  Fn(([p, settings]: [V3, V4]) => {
    const q = p.xz.mul(vec2(0.75, 1)).toVar();
    const frequency = settings.w.toVar();
    const amplitude = settings.y.toVar();
    const choppy = settings.z.toVar();
    const height = float(0).toVar();
    Loop(iterations, () => {
      const waves = octave(q.add(settings.x).mul(frequency), choppy).add(
        octave(q.sub(settings.x).mul(frequency), choppy),
      );
      height.addAssign(waves.mul(amplitude));
      // GLSL uv *= mat2(1.6, 1.2, -1.2, 1.6) is a ROW vector multiply.
      q.assign(vec2(q.x.mul(1.6).add(q.y.mul(1.2)), q.x.mul(-1.2).add(q.y.mul(1.6))));
      frequency.mulAssign(1.9);
      amplitude.mulAssign(0.22);
      choppy.assign(mix(choppy, 1, 0.2));
    });
    return p.y.sub(height);
  }).setLayout({
    name: `seascapeHeight${iterations}`,
    type: 'float',
    inputs: [
      { name: 'p', type: 'vec3' },
      { name: 'settings', type: 'vec4' },
    ],
  });

const coarseHeight = heightField(3);
const detailedHeight = heightField(5);

const sky = Fn(([direction]: [V3]) => {
  const y = max(direction.y, 0).mul(0.8).add(0.2).mul(0.8);
  const horizon = float(1).sub(y);
  return vec3(horizon.mul(horizon), horizon, horizon.mul(0.4).add(0.6)).mul(1.1);
}).setLayout({ name: 'seascapeSky', type: 'vec3', inputs: [{ name: 'direction', type: 'vec3' }] });

const createShader: ShaderFactory = (context) => {
  const speed = uniform(0.8);
  const height = uniform(0.6);
  const choppy = uniform(4);
  const frequency = uniform(0.16);
  const reflection = uniform(1);
  const elapsed = float(context.time as unknown as number);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const pointer = vec2(context.pointer as unknown as THREE.Vector2).sub(0.5);

  const colorNode = Fn(() => {
    const screen = uv()
      .mul(2)
      .sub(1)
      .mul(vec2(resolution.x.div(resolution.y), 1));
    const cameraTime = elapsed.mul(0.3);
    const settings = vec4(elapsed.mul(speed).add(1), height, choppy, frequency);
    const ang = vec3(
      sin(cameraTime.mul(3)).mul(0.1).add(pointer.y.mul(0.25)),
      sin(cameraTime).mul(0.2).add(0.3),
      cameraTime.add(pointer.x.mul(0.8)),
    );
    const a = sin(ang);
    const b = cos(ang);
    const origin = vec3(0, 3.5, cameraTime.mul(5));
    const ray = normalize(vec3(screen, -2)).toVar();
    ray.z.addAssign(length(screen).mul(0.14));
    ray.assign(normalize(ray));
    // dot with each matrix column reproduces normalize(dir) * fromEuler(ang).
    const direction = vec3(
      dot(
        ray,
        vec3(
          b.x.mul(b.z).add(a.x.mul(a.y).mul(a.z)),
          b.x.mul(a.y).mul(a.z).add(b.z.mul(a.x)),
          b.y.mul(a.z).negate(),
        ),
      ),
      dot(ray, vec3(b.y.mul(a.x).negate(), b.x.mul(b.y), a.y)),
      dot(
        ray,
        vec3(
          b.z.mul(a.x).mul(a.y).add(b.x.mul(a.z)),
          a.x.mul(a.z).sub(b.x.mul(b.z).mul(a.y)),
          b.y.mul(b.z),
        ),
      ),
    ).toVar();

    const near = float(0).toVar();
    const far = float(1000).toVar();
    const nearHeight = coarseHeight(origin, settings).toVar();
    const farHeight = coarseHeight(origin.add(direction.mul(far)), settings).toVar();
    const point = origin.add(direction.mul(far)).toVar();
    const color = sky(direction).toVar();

    // This is bracketed height-field root finding, not SDF sphere tracing.
    If(farHeight.lessThanEqual(0), () => {
      Loop(32, () => {
        const depth = mix(
          near,
          far,
          nearHeight.div(max(nearHeight.sub(farHeight), 0.000001)),
        ).toVar();
        point.assign(origin.add(direction.mul(depth)));
        const h = coarseHeight(point, settings).toVar();
        If(abs(h).lessThan(0.001), () => {
          Break();
        });
        If(h.lessThan(0), () => {
          far.assign(depth);
          farHeight.assign(h);
        }).Else(() => {
          near.assign(depth);
          nearHeight.assign(h);
        });
      });

      const distance = point.sub(origin);
      const eps = max(dot(distance, distance).mul(0.1).div(resolution.x), 0.0001);
      const center = detailedHeight(point, settings).toVar();
      const normal = normalize(
        vec3(
          detailedHeight(point.add(vec3(eps, 0, 0)), settings).sub(center),
          eps,
          detailedHeight(point.add(vec3(0, 0, eps)), settings).sub(center),
        ),
      ).toVar();
      const light = normalize(vec3(0, 1, 0.8));
      const fresnel = min(
        pow(clamp(float(1).sub(dot(normal, direction.negate())), 0, 1), 3),
        0.5,
      ).mul(reflection);
      const waterTint = vec3(0.8, 0.9, 0.6).mul(0.6);
      const diffuse = pow(max(dot(normal, light).mul(0.4).add(0.6), 0), 80);
      const refracted = vec3(0, 0.09, 0.18).add(waterTint.mul(diffuse).mul(0.12));
      const sea = mix(refracted, sky(reflect(direction, normal)), fresnel).toVar();
      const attenuation = max(float(1).sub(dot(distance, distance).mul(0.001)), 0);
      sea.addAssign(waterTint.mul(point.y.sub(height)).mul(0.18).mul(attenuation));
      sea.addAssign(
        pow(max(dot(reflect(direction, normal), light), 0), 60).mul(68 / (Math.PI * 8)),
      );
      // Avoid GLSL smoothstep with reversed edges (undefined by the spec).
      const horizonBlend = pow(float(1).sub(smoothstep(-0.02, 0, direction.y)), 0.2);
      color.assign(mix(sky(direction), sea, horizonBlend));
    });

    // Original 0.65 display curve; decode once so renderer sRGB output does not double-encode.
    return sRGBTransferEOTF(pow(max(color, vec3(0)), vec3(0.65))) as V3;
  })();

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  return {
    material,
    controls: [
      {
        id: 'seascape-speed',
        kind: 'number',
        label: '海浪速度',
        description: '两组相向波形的相位推进速度，零值可冻结波形。',
        min: 0,
        max: 1.6,
        step: 0.05,
        initial: 0.8,
        uniform: speed,
      },
      {
        id: 'seascape-height',
        kind: 'number',
        label: '海浪高度',
        description: '控制各层波浪的振幅。',
        min: 0.2,
        max: 1,
        step: 0.05,
        initial: 0.6,
        uniform: height,
      },
      {
        id: 'seascape-choppy',
        kind: 'number',
        label: '浪峰尖锐度',
        description: '改变波形的幂指数，观察圆滑波纹如何变成尖锐浪峰。',
        min: 1,
        max: 6,
        step: 0.1,
        initial: 4,
        uniform: choppy,
      },
      {
        id: 'seascape-frequency',
        kind: 'number',
        label: '波纹密度',
        description: '控制第一层波浪频率，后续细波按 1.9 倍递增。',
        min: 0.08,
        max: 0.24,
        step: 0.01,
        initial: 0.16,
        uniform: frequency,
      },
      {
        id: 'seascape-reflection',
        kind: 'number',
        label: '天空反射',
        description: '缩放 Fresnel 权重，观察天空反射如何揭示海面法线。',
        min: 0,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: reflection,
      },
    ],
  };
};

export default createShader;
