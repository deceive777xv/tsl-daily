/*
 * Flux Core — Otavio Good / otaviogood (ltlSWf).
 * CC0 1.0, including this TSL adaptation. See the case LICENSE.md.
 * Explicit source declaration in the approved historical mirror:
 * https://www.shadertoy.com/view/ltlSWf
 */
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
  dot,
  float,
  floor,
  fract,
  length,
  log,
  max,
  min,
  mix,
  mod,
  normalize,
  pow,
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

const hash2 = Fn(([point]: [V2]) =>
  fract(sin(point.x.add(point.y.mul(37))).mul(104003.9)),
).setLayout({ name: 'fluxHash2', type: 'float', inputs: [{ name: 'point', type: 'vec2' }] });
const hash3 = Fn(([point]: [V3]) =>
  fract(sin(point.x.add(point.y.mul(37)).add(point.z.mul(521))).mul(110003.9)),
).setLayout({ name: 'fluxHash3', type: 'float', inputs: [{ name: 'point', type: 'vec3' }] });

const noise3 = Fn(([point]: [V3]) => {
  const cell = floor(point).toVar();
  const fraction = fract(point).toVar();
  const blend = fraction.mul(fraction).mul(vec3(3).sub(fraction.mul(2)));
  const near = mix(
    mix(hash3(cell), hash3(cell.add(vec3(1, 0, 0))), blend.x),
    mix(hash3(cell.add(vec3(0, 1, 0))), hash3(cell.add(vec3(1, 1, 0))), blend.x),
    blend.y,
  );
  const far = mix(
    mix(hash3(cell.add(vec3(0, 0, 1))), hash3(cell.add(vec3(1, 0, 1))), blend.x),
    mix(hash3(cell.add(vec3(0, 1, 1))), hash3(cell.add(vec3(1, 1, 1))), blend.x),
    blend.y,
  );
  return mix(near, far, blend.z);
}).setLayout({ name: 'fluxNoise3', type: 'float', inputs: [{ name: 'point', type: 'vec3' }] });

const rustNoise = Fn(([position]: [V3]) => {
  const point = position.toVar();
  const phase = noise3(point.mul(0.125))
    .add(noise3(point.mul(0.25)).mul(0.5))
    .add(noise3(point.mul(0.5)).mul(0.25))
    .add(noise3(point).mul(0.125))
    .toVar();
  const result = float(0).toVar();
  const normalizer = 1 / Math.sqrt(1 + 0.71 * 0.71);
  Loop(7, () => {
    const wave = clamp(cos(point.y.mul(0.25).add(phase)).sub(0.998), 0, 1);
    result.addAssign(wave.mul(noise3(point.mul(0.125))).mul(1016));
    // Each plane rotation uses its old pair; XZ then reads the updated X.
    const xy = point.xy.toVar();
    const turnedXY = xy.add(vec2(xy.y, xy.x.negate()).mul(0.71)).mul(normalizer).toVar();
    point.assign(vec3(turnedXY, point.z));
    const xz = point.xz.toVar();
    const turnedXZ = xz.add(vec2(xz.y, xz.x.negate()).mul(0.71)).mul(normalizer).toVar();
    point.assign(vec3(turnedXZ.x, point.y, turnedXZ.y));
  });
  return result;
}).setLayout({
  name: 'fluxRustNoise',
  type: 'float',
  inputs: [{ name: 'position', type: 'vec3' }],
});

const box = Fn(([point, size]: [V3, V3]) => {
  const edge = abs(point).sub(size);
  return min(max(edge.x, max(edge.y, edge.z)), 0).add(length(max(edge, 0)));
}).setLayout({
  name: 'fluxBox',
  type: 'float',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'size', type: 'vec3' },
  ],
});

// settings = (wrapped source time, spiral blend, hole radius, raw-time pulse).
// Return (distance, central beam contribution, orange ring, blue spiral).
// Explicit contributions replace the source's mutable global glow variables.
const field = Fn(([position, settings]: [V3, V4]) => {
  const radius = max(length(position.yz), 0.000001).toVar();
  const angle = atan(position.y, position.z).div(Math.PI).toVar();
  const spiralRadius = abs(
    fract(log(radius).add(angle.mul(0.5)))
      .sub(0.5)
      .mul(2),
  );
  const foldedAngle = abs(abs(angle.mul(2).sub(1)).mul(2).sub(1));
  const point = mix(position, vec3(position.x, spiralRadius, foldedAngle), settings.y).toVar();
  const xyRadius = length(point.xy);
  const distance = max(xyRadius.sub(3.5), xyRadius.sub(2.85).negate()).toVar();
  distance.assign(max(distance, abs(fract(point.z).sub(0.5)).negate().add(0.04)));

  const cell = fract(point).sub(0.5).toVar();
  const scale = float(1).toVar();
  Loop(3, ({ i }) => {
    const divider = max(1, float(i));
    for (const pair of [cell.xz, cell.xy, cell.yz]) {
      const cut = length(pair.div(scale)).sub(settings.z.div(scale)).div(divider);
      distance.assign(max(distance, cut.negate()));
    }
    scale.mulAssign(2.14);
    cell.assign(fract(cell.mul(scale)).sub(0.5));
  });

  const strutPoint = vec3(abs(point.x).sub(2.45), point.y, fract(point.z).sub(0.5)).toVar();
  strutPoint.y.addAssign(float(0.1).sub(sin(abs(point.x).sub(5.4).mul(2)).mul(1.1)));
  const strut = box(strutPoint, vec3(1.5, 0.05, 0.02)).mul(0.5);
  distance.assign(min(distance, strut));

  const jolt = max(0, sin(radius.add(settings.x.mul(20))))
    .mul(0.94)
    .mul(clamp(float(0.3).sub(settings.w), 0, 1))
    .toVar();
  const ringPoint = vec3(point.x.sub(0.05), fract(point.yz).sub(0.5)).toVar();
  const turned = vec3(
    ringPoint.x,
    cos(settings.w).mul(ringPoint.y).add(sin(settings.w).mul(ringPoint.z)),
    sin(settings.w).negate().mul(ringPoint.y).add(cos(settings.w).mul(ringPoint.z)),
  );
  const spiral = box(turned, vec3(jolt.add(0.01), 1.06, settings.z.mul(0.01)).div(2.14)).toVar();
  distance.assign(min(distance, spiral.add(float(1).sub(settings.y).mul(100))));

  const torusPoint = vec3(abs(point.x).negate().add(3), fract(point.z).sub(0.5), point.y).toVar();
  const wobble = sin(
    atan(torusPoint.x, torusPoint.z).mul(2).add(settings.x.mul(4)).add(point.z.mul(3.234567)),
  );
  const torusPair = vec2(length(torusPoint.xz).sub(0.2).sub(wobble.mul(0.1)), torusPoint.y);
  const torus = pow(pow(abs(torusPair.x), 8).add(pow(abs(torusPair.y), 8)), 0.125)
    .sub(0.0003)
    .toVar();
  distance.assign(min(distance, torus));

  const beam = float(0.02)
    .add(abs(sin(position.x.sub(settings.x.mul(3))).mul(0.15)).mul(jolt))
    .div(radius);
  return vec4(
    distance,
    beam,
    float(0.0015).div(max(0.03, torus)),
    float(0.0018).div(max(0.0025, spiral)),
  );
}).setLayout({
  name: 'fluxField',
  type: 'vec4',
  inputs: [
    { name: 'position', type: 'vec3' },
    { name: 'settings', type: 'vec4' },
  ],
});

const renderRay = Fn(
  ([origin, direction, screen, settings, rustScale, glowStrength, fade]: [
    V3,
    V3,
    V2,
    V4,
    F,
    F,
    F,
  ]) => {
    const travel = hash2(screen).mul(0.1).add(0.1).toVar();
    const position = vec3(0).toVar();
    const distance = float(1).toVar();
    const glows = vec3(0).toVar();
    Loop(210, () => {
      position.assign(origin.add(direction.mul(travel)).yzx);
      const sample = field(position, settings).toVar();
      glows.addAssign(sample.yzw);
      distance.assign(min(sample.x, length(position.yz)));
      travel.addAssign(distance);
      If(travel.greaterThan(45).or(abs(distance).lessThan(0.000625)), () => {
        Break();
      });
    });
    const rayGlows = glows.toVar();
    const orange = rayGlows.y.toVar();
    const color = vec3(0).toVar();
    If(travel.lessThanEqual(45), () => {
      const nx = field(position.sub(vec3(0.000625, 0, 0)), settings).toVar();
      const ny = field(position.sub(vec3(0, 0.000625, 0)), settings).toVar();
      const nz = field(position.sub(vec3(0, 0, 0.000625)), settings).toVar();
      orange.addAssign(nx.z.add(ny.z).add(nz.z));
      const normal = normalize(
        vec3(distance.sub(nx.x), distance.sub(ny.x), distance.sub(nz.x)),
      ).toVar();
      const nearAO = float(1).toVar();
      for (const offset of [0.05, 0.1, 0.2, 0.4, 0.8]) {
        const sample = field(position.add(normal.mul(offset)), settings).toVar();
        orange.addAssign(sample.z);
        nearAO.mulAssign(clamp(sample.x.div(offset), 0, 1));
      }
      const farAO = field(position.add(normal.mul(1.6)), settings).toVar();
      orange.addAssign(farAO.z);
      const ambient = clamp(nearAO.mul(clamp(farAO.x.mul(0.625), 0, 1)), 0, 1).toVar();

      const sun = normalize(vec3(0.93, 1, -1.5));
      const shadow = float(1).toVar();
      const shadowTravel = float(0.01).toVar();
      const shadowStart = position.add(normal.mul(0.002)).toVar();
      Loop(30, () => {
        const sample = field(shadowStart.add(sun.mul(shadowTravel)), settings).toVar();
        orange.addAssign(sample.z);
        shadow.mulAssign(clamp(sample.x.mul(150), 0, 1));
        If(sample.x.lessThanEqual(0), () => {
          Break();
        });
        shadowTravel.addAssign(max(0.01, sample.x));
        If(shadowTravel.greaterThan(4.2), () => {
          Break();
        });
      });

      const grain = noise3(position.mul(32))
        .add(noise3(position.mul(64)))
        .add(noise3(position.mul(128)))
        .add(noise3(position.mul(256)))
        .add(noise3(position.mul(512)))
        .mul(0.8)
        .toVar();
      normal.assign(normalize(normal.add(grain.sub(2).mul(0.1))));
      const base = vec3(0.95, 1, 1);
      const rust = vec3(0.65, 0.25, 0.1).sub(noise3(position.mul(128)));
      const rustMask = clamp(rustNoise(position.mul(8).mul(rustScale)), 0, 1).sub(0.2);
      // Source smoothstep has reversed vector edges. Spell out its cubic to
      // preserve that algebra without depending on undefined edge ordering.
      const blend = clamp(vec3(rustMask).sub(base).div(rust.sub(base)), 0, 1).toVar();
      const texture = clamp(
        base
          .mul(blend.mul(blend).mul(vec3(3).sub(blend.mul(2))))
          .mul(grain)
          .mul(0.035),
        0,
        1,
      );
      const ambientAverage = ambient.mul(3).add(nearAO).mul(0.25);
      const lighting = vec3(3.6)
        .mul(clamp(dot(sun, normal), 0, 1))
        .mul(shadow)
        .add(
          vec3(1, 0.2, 0.4)
            .mul(clamp(normal.z.mul(-0.5).add(0.5), 0, 1))
            .mul(pow(ambientAverage, 0.35)),
        )
        .add(
          vec3(0.1, 0.5, 0.99)
            .mul(clamp(normal.y.mul(0.5).add(0.5), 0, 1))
            .mul(pow(ambientAverage, 0.35)),
        )
        .add(
          vec3(0.3, 0.5, 0.9)
            .mul(clamp(dot(position.negate(), normal), 0, 1))
            .mul(pow(nearAO, 0.3)),
        )
        .mul(4);
      color.assign(texture.mul(lighting));
    });
    // The original saves central/spiral glow before normals/AO, but uses orange
    // glow after those extra field queries. Keep this source-specific ordering.
    color.addAssign(vec3(0.3, 0.5, 0.9).mul(rayGlows.x).mul(1.2).mul(glowStrength));
    color.addAssign(vec3(0.9, 0.5, 0.3).mul(orange).mul(1.2).mul(glowStrength));
    color.addAssign(vec3(0.25, 0.29, 0.93).mul(rayGlows.z).mul(2).mul(glowStrength));
    color.mulAssign(clamp(float(1).sub(length(screen.div(2.5))), 0, 1));
    return sqrt(clamp(color, 0, 1).mul(clamp(fade.add(0.25), 0, 1)));
  },
).setLayout({
  name: 'fluxRenderRay',
  type: 'vec3',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'screen', type: 'vec2' },
    { name: 'settings', type: 'vec4' },
    { name: 'rustScale', type: 'float' },
    { name: 'glowStrength', type: 'float' },
    { name: 'fade', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    structure = uniform(1),
    carving = uniform(0.32),
    glow = uniform(1),
    rust = uniform(1);
  const rawTime = float(context.time as unknown as number)
    .mul(speed)
    .add(20);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const time = mod(rawTime, 70).toVar();
    const pulseWave = sin(rawTime).toVar();
    const pulse = clamp(pow(abs(pulseWave), 0.75).mul(sign(pulseWave)).mul(1.5), -1, 1)
      .mul(Math.PI / 4)
      .add(Math.PI / 4);
    const origin = vec3(0).toVar();
    const up = vec3(0, 1, 0).toVar();
    const target = vec3(0).toVar();
    const animatedStructure = float(1).toVar();
    const fade = float(1).toVar();
    If(time.lessThan(9), () => {
      const alpha = time.div(9);
      animatedStructure.assign(0);
      fade.assign(clamp(time, 0, 1).mul(clamp(float(9).sub(time), 0, 1)));
      origin.assign(vec3(float(56).sub(alpha.mul(6.8)), -2.5, 1.5));
      target.assign(vec3(50, 0, 0));
    })
      .ElseIf(time.lessThan(16), () => {
        const alpha = time.sub(9).div(7);
        animatedStructure.assign(0);
        fade.assign(clamp(time.sub(9), 0, 1).mul(clamp(float(16).sub(time), 0, 1)));
        origin.assign(vec3(float(12).sub(smoothstep(0, 1, alpha).mul(4.8)), 3.3, -0.5));
        target.assign(vec3(0, 5.5, -0.5));
      })
      .ElseIf(time.lessThan(24), () => {
        const alpha = time.sub(16).div(8);
        fade.assign(clamp(time.sub(16), 0, 1).mul(clamp(float(24).sub(time), 0, 1)));
        origin.assign(
          vec3(cos(alpha).mul(6.3), float(6.3).sub(alpha.mul(1.8)), sin(alpha).mul(6.3)),
        );
        up.assign(normalize(vec3(0, 1, float(-0.3).sub(alpha.mul(0.5)))));
        target.assign(vec3(0, 0, -0.5));
      })
      .ElseIf(time.lessThan(40), () => {
        const alpha = time.sub(24).div(16);
        fade.assign(clamp(time.sub(24), 0, 1).mul(clamp(float(40).sub(time), 0, 1)));
        origin.assign(
          vec3(
            cos(alpha).mul(6.5).sub(alpha.mul(0.25)),
            float(3).sub(alpha.mul(1.8)),
            float(-2.6).add(sin(alpha).mul(6.5)).sub(alpha.mul(0.25)),
          ),
        );
      })
      .ElseIf(time.lessThan(48), () => {
        const alpha = time.sub(40).div(8);
        fade.assign(clamp(time.sub(40), 0, 1).mul(clamp(float(48).sub(time), 0, 1)));
        origin.assign(
          vec3(
            cos(alpha).mul(1.5).sub(alpha.mul(1.5)),
            float(-7).sub(alpha.mul(1.8)),
            float(-0.9).add(sin(alpha).mul(1.5)).sub(alpha.mul(1.5)),
          ),
        );
        target.assign(vec3(0, -3, 0));
      })
      .Else(() => {
        const alpha = time.sub(48).div(22);
        const morph = smoothstep(0, 1, clamp(alpha.mul(1.8).sub(0.1), 0, 1)).toVar();
        animatedStructure.assign(float(1).sub(morph));
        fade.assign(clamp(time.sub(48), 0, 1).mul(clamp(float(70).sub(time), 0, 1)));
        origin.assign(vec3(float(10).sub(alpha.mul(6.8)), morph.sub(0.95), 0));
        up.assign(normalize(vec3(0, float(1).sub(morph), morph)));
      });
    const forward = normalize(target.sub(origin));
    const right = normalize(cross(up, forward));
    const cameraUp = cross(forward, right);
    const screen = uv().mul(2).sub(1).toVar();
    const direction = normalize(
      forward
        .add(right.mul(screen.x).mul(resolution.x.div(resolution.y)))
        .add(cameraUp.mul(screen.y)),
    );
    const settings = vec4(time, animatedStructure.mul(structure), carving, pulse);
    const color = renderRay(origin, direction, screen, settings, rust, glow, fade);
    return sRGBTransferEOTF(clamp(color, 0, 1)) as V3;
  })();
  return {
    material,
    controls: [
      {
        id: 'flux-speed',
        kind: 'number',
        label: '动画速度',
        description: '改变原作 70 秒相机与结构循环的时间倍率；零值回到第 20 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'flux-structure',
        kind: 'number',
        label: '螺旋变形',
        description: '缩放螺旋空间与原始空间的混合权重，观察几何查询空间怎样改变结构。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 1,
        uniform: structure,
      },
      {
        id: 'flux-carving',
        kind: 'number',
        label: '孔洞半径',
        description: '调整三个方向圆柱切割的半径；默认 0.32 保留原作的镂空。',
        min: 0.22,
        max: 0.4,
        step: 0.01,
        initial: 0.32,
        uniform: carving,
      },
      {
        id: 'flux-glow',
        kind: 'number',
        label: '辉光亮度',
        description: '同时缩放中心束、橙色环带与蓝色螺旋的光累积，不改变实体几何。',
        min: 0.4,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: glow,
      },
      {
        id: 'flux-rust',
        kind: 'number',
        label: '锈纹尺度',
        description: '改变程序化锈纹的输入频率；较大值生成更细的纹理。',
        min: 0.5,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: rust,
      },
    ],
  };
};

export default createShader;
