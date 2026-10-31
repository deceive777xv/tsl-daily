/*
 * Remnant X — Dave_Hoskins / David Hoskins (4sjSW1).
 * Original Image and Sound: CC BY-NC-SA 3.0 Unported, explicit historical headers.
 * TSL adaptation and generated input: TSL Daily contributors, 2026, same license.
 * Preserve the original acknowledgment of boxplorer and Fractalforums.com.
 * This is a silent visual adaptation; the original noise image is never fetched.
 * See src/data/shaders/remnant-x/LICENSE.md for the approved evidence and changes.
 */
import * as THREE from 'three/webgpu';
import {
  Break,
  Fn,
  If,
  Loop,
  clamp,
  cos,
  cross,
  dot,
  exp,
  float,
  floor,
  fract,
  length,
  log,
  mat3,
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
  sRGBTransferEOTF,
  step,
  texture,
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

// New deterministic data, not a copy of the Shadertoy input. The shifted green
// channel connects adjacent z slices used by the source's .yx noise sampling.
function createNoise(): THREE.DataTexture {
  const size = 256;
  const bytes = new Uint8Array(size * size * 4);
  let state = 0x73ac901d;
  for (let i = 0; i < bytes.length; i += 4) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    bytes[i] = bytes[i + 2] = state >>> 24;
    bytes[i + 3] = 255;
  }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      bytes[(y * size + x) * 4 + 1] =
        bytes[(((y - 17 + size) % size) * size + ((x - 37 + size) % size)) * 4];
    }
  const noise = new THREE.DataTexture(bytes, size, size);
  noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
  noise.minFilter = noise.magFilter = THREE.LinearFilter;
  noise.generateMipmaps = false;
  noise.colorSpace = THREE.NoColorSpace;
  noise.flipY = false;
  noise.needsUpdate = true;
  return noise;
}

const field = Fn(([point]: [V3]) => {
  const initial = vec4(point, 1);
  const folded = initial.toVar();
  Loop(9, () => {
    folded.xyz.assign(clamp(folded.xyz, -1, 1).mul(2).sub(folded.xyz));
    const radius2 = dot(folded.xyz, folded.xyz).toVar();
    folded.mulAssign(clamp(max(float(0.25).div(max(radius2, 1e-12)), 0.25), 0, 1));
    folded.assign(folded.mul(vec4(2.8, 2.8, 2.8, 2.8).div(0.25)).add(initial));
  });
  // w carries the accumulated scale for the distance estimate, not opacity.
  return length(folded.xyz).sub(1.8).div(folded.w).sub(Math.pow(2.8, -9));
}).setLayout({ name: 'remnantField', type: 'float', inputs: [{ name: 'point', type: 'vec3' }] });

const refineHit = Fn(([origin, direction, interval]: [V3, V3, V2]) => {
  const bracket = interval.toVar();
  const midpoint = float(0).toVar();
  Loop(6, () => {
    midpoint.assign(dot(bracket, vec2(0.5)));
    const distance = field(origin.add(direction.mul(midpoint)));
    bracket.assign(
      mix(vec2(bracket.x, midpoint), vec2(midpoint, bracket.y), step(0.0005, distance)),
    );
  });
  return midpoint;
}).setLayout({
  name: 'remnantRefineHit',
  type: 'float',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'interval', type: 'vec2' },
  ],
});

const march = Fn(([origin, direction, jitter]: [V3, V3, F]) => {
  const travel = jitter.mul(0.05).add(0.05).toVar();
  const previous = float(0).toVar();
  const glow = float(0).toVar();
  const hit = float(1000).toVar();
  Loop(100, () => {
    If(travel.greaterThan(12), () => {
      Break();
    });
    const distance = field(origin.add(direction.mul(travel))).toVar();
    If(distance.lessThan(0.0005), () => {
      hit.assign(refineHit(origin, direction, vec2(previous, travel)));
      Break();
    });
    glow.addAssign(clamp(float(0.05).sub(distance), 0, 0.4));
    previous.assign(travel);
    travel.addAssign(distance.add(travel.mul(0.001)));
  });
  return vec2(hit, clamp(glow.mul(0.25), 0, 1));
}).setLayout({
  name: 'remnantMarch',
  type: 'vec2',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'jitter', type: 'float' },
  ],
});

const normalAt = Fn(([point, travel]: [V3, F]) => {
  const e = max(travel.mul(0.0011), 1e-7);
  return normalize(
    vec3(
      field(point.add(vec3(e, 0, 0))).sub(field(point.sub(vec3(e, 0, 0)))),
      field(point.add(vec3(0, e, 0))).sub(field(point.sub(vec3(0, e, 0)))),
      field(point.add(vec3(0, 0, e))).sub(field(point.sub(vec3(0, 0, e)))),
    ),
  );
}).setLayout({
  name: 'remnantNormal',
  type: 'vec3',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'travel', type: 'float' },
  ],
});

const shadowAt = Fn(([origin, direction]: [V3, V3]) => {
  const shadow = float(1).toVar();
  const travel = float(0.05).toVar();
  Loop(8, () => {
    const distance = field(origin.add(direction.mul(travel))).toVar();
    shadow.assign(min(distance.mul(6).div(travel), shadow));
    travel.addAssign(distance);
  });
  return max(shadow, 0);
}).setLayout({
  name: 'remnantShadow',
  type: 'float',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
  ],
});

const orbitColor = Fn(([point, time, amount]: [V3, F, F]) => {
  const folded = point.toVar();
  const trap = float(1).toVar();
  Loop(6, () => {
    folded.assign(clamp(folded, -1, 1).mul(2).sub(folded));
    const radius2 = dot(folded, folded).toVar();
    folded.mulAssign(clamp(max(float(0.25).div(max(radius2, 1e-12)), 0.25), 0, 1));
    folded.assign(folded.mul(11.2).add(point));
    trap.assign(min(trap, radius2));
  });
  const weights = clamp(
    vec2(
      log(max(dot(folded, folded), 1e-12))
        .mul(0.3333)
        .sub(1),
      sqrt(trap),
    ),
    0,
    1,
  ).mul(amount);
  const phase = mod(length(point).sub(time.mul(150)), 16);
  const pulse = pow(smoothstep(0, 0.3, phase).mul(smoothstep(0.6, 0.3, phase)), 10);
  const red = mix(vec3(0.8, 0, 0), vec3(0.4, 3, 5), pulse);
  return mix(mix(red, vec3(0.4, 0.4, 0.5), weights.y), vec3(0.5, 0.3, 0), weights.x);
}).setLayout({
  name: 'remnantOrbitColor',
  type: 'vec3',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'time', type: 'float' },
    { name: 'amount', type: 'float' },
  ],
});

const cameraPath = Fn(([time]: [F]) =>
  vec3(
    sin(time.mul(2.14)).mul(3).sub(0.78),
    sin(time.mul(0.942).add(1.3)).mul(2.5).add(0.05),
    cos(time.mul(3.594)).mul(3.5).add(0.05),
  ),
).setLayout({ name: 'remnantCameraPath', type: 'vec3', inputs: [{ name: 'time', type: 'float' }] });

const rotateAxis = Fn(([axis, angle, direction]: [V3, F, V3]) => {
  const a = normalize(axis).toVar();
  const s = sin(angle),
    c = cos(angle),
    oc = float(1).sub(c);
  // Preserve the scalar constructor's column order in the original GLSL.
  return mat3(
    vec3(
      oc.mul(a.x).mul(a.x).add(c),
      oc.mul(a.x).mul(a.y).sub(a.z.mul(s)),
      oc.mul(a.z).mul(a.x).add(a.y.mul(s)),
    ),
    vec3(
      oc.mul(a.x).mul(a.y).add(a.z.mul(s)),
      oc.mul(a.y).mul(a.y).add(c),
      oc.mul(a.y).mul(a.z).sub(a.x.mul(s)),
    ),
    vec3(
      oc.mul(a.z).mul(a.x).sub(a.y.mul(s)),
      oc.mul(a.y).mul(a.z).add(a.x.mul(s)),
      oc.mul(a.z).mul(a.z).add(c),
    ),
  ).mul(direction);
}).setLayout({
  name: 'remnantRotateAxis',
  type: 'vec3',
  inputs: [
    { name: 'axis', type: 'vec3' },
    { name: 'angle', type: 'float' },
    { name: 'direction', type: 'vec3' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    pathOffset = uniform(0),
    orbitAmount = uniform(1),
    shadowAmount = uniform(1),
    glowAmount = uniform(1);
  const elapsed = float(context.time as unknown as number);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const noise = createNoise();
  const noise3 = Fn(([point]: [V3]) => {
    const cell = floor(point);
    const f = fract(point).toVar();
    f.assign(f.mul(f).mul(float(3).sub(f.mul(2))));
    const coordinates = cell.xy.add(vec2(37, 17).mul(cell.z)).add(f.xy);
    const rg = texture(noise, coordinates.add(0.5).div(256)).level(float(0)).yx.toVar();
    return mix(rg.x, rg.y, f.z);
  }).setLayout({ name: 'remnantNoise3', type: 'float', inputs: [{ name: 'point', type: 'vec3' }] });
  const skyAt = Fn(([direction]: [V3]) => {
    const p = direction.mul(2.3);
    return noise3(p)
      .add(noise3(p.mul(2.1)).mul(0.5))
      .add(noise3(p.mul(4.3)).mul(0.25))
      .add(noise3(p.mul(7.9)).mul(0.125));
  }).setLayout({
    name: 'remnantSky',
    type: 'float',
    inputs: [{ name: 'direction', type: 'vec3' }],
  });

  const material = new THREE.MeshBasicNodeMaterial();
  material.addEventListener('dispose', () => noise.dispose());
  material.colorNode = Fn(() => {
    const time = elapsed.mul(speed).add(2).add(pathOffset).mul(0.01).add(15).toVar();
    const screen = uv().toVar();
    const plane = screen
      .mul(2)
      .sub(1)
      .mul(vec2(resolution.x.div(resolution.y), 1));
    const origin = cameraPath(time).toVar();
    const forward = normalize(cameraPath(time.add(0.01)).sub(origin)).toVar();
    const roll = sin(time.mul(0.5).add(0.4)).mul(13);
    const right = normalize(cross(forward, vec3(sin(roll), cos(roll), 0))).toVar();
    const up = cross(right, forward).toVar();
    forward.assign(rotateAxis(up, sin(time.mul(-20)).mul(0.7), forward));
    const direction = normalize(
      right.mul(plane.x).add(up.mul(plane.y)).add(forward.mul(1.3)),
    ).toVar();
    const spotPosition = cameraPath(time.add(0.03))
      .add(vec3(sin(time.mul(18.4)), cos(time.mul(17.98)), sin(time.mul(22.53))).mul(0.2))
      .toVar();
    const jitter = texture(noise, screen.mul(resolution).div(256)).level(float(0)).y;
    const hit = march(origin, direction, jitter).toVar();
    const color = vec3(0).toVar();
    If(hit.x.lessThan(900), () => {
      const point = origin.add(direction.mul(hit.x)).toVar();
      const normal = normalAt(point, hit.x).toVar();
      const towardSpot = spotPosition.sub(point).toVar();
      const attenuation = max(length(towardSpot), 1e-7).toVar();
      towardSpot.divAssign(attenuation);
      const sun = normalize(vec3(0.35, 0.1, 0.3));
      const spotShadow = mix(1, shadowAt(point, towardSpot), shadowAmount).toVar();
      const sunShadow = mix(1, shadowAt(point, sun), shadowAmount).toVar();
      const spotBrightness = max(dot(towardSpot, normal), 0)
        .div(pow(attenuation, 1.5))
        .mul(0.25)
        .toVar();
      const sunBrightness = max(dot(sun, normal), 0).mul(0.2).toVar();
      const surface = orbitColor(point, time, orbitAmount).toVar();
      color.assign(
        surface.mul(spotBrightness).mul(spotShadow).add(surface.mul(sunBrightness).mul(sunShadow)),
      );
      const reflected = reflect(direction, normal).toVar();
      color.addAssign(
        pow(max(dot(towardSpot, reflected), 0), 10)
          .mul(2)
          .mul(spotShadow)
          .mul(spotBrightness),
      );
      color.addAssign(
        pow(max(dot(sun, reflected), 0), 10)
          .mul(2)
          .mul(sunShadow)
          .mul(sunBrightness),
      );
    });
    const sky = vec3(0.03, 0.04, 0.05).mul(skyAt(direction));
    color.assign(mix(sky, color, min(exp(hit.x.negate().add(1.5)), 1)));
    color.addAssign(vec3(0.02, 0.04, 0.1).mul(pow(hit.y, 2)).mul(glowAmount));
    const spotFromCamera = spotPosition.sub(origin).toVar();
    If(length(spotFromCamera).lessThan(hit.x), () => {
      const alignment = max(dot(normalize(spotFromCamera), direction), 0).toVar();
      color.addAssign(pow(alignment, 500).add(pow(alignment, 5000).mul(0.2)).mul(0.6));
    });
    const bright = color.mul(1.5).toVar();
    color.assign(
      mix(vec3(0.5), mix(vec3(dot(vec3(0.2125, 0.7154, 0.0721), bright)), bright, 1.5), 1.08),
    );
    const vignette = pow(
      screen.x.mul(screen.y).mul(float(1).sub(screen.x)).mul(float(1).sub(screen.y)).mul(20),
      0.2,
    )
      .mul(0.5)
      .add(0.5);
    // Guard negative fractional powers; source display-space grading is decoded
    // before the shared renderer performs its single sRGB output conversion.
    return sRGBTransferEOTF(clamp(pow(max(color.mul(vignette), 0), 0.47), 0, 1)) as V3;
  })();
  return {
    material,
    controls: [
      {
        id: 'remnant-speed',
        kind: 'number',
        label: '飞行速度',
        description: '改变相机与青色光脉冲的时间倍率；零值停在原作第 2 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'remnant-path',
        kind: 'number',
        label: '路径偏移',
        description: '沿原作预设曲线前移，相当于原作鼠标横向的时间偏移；不会改变分形几何。',
        min: 0,
        max: 300,
        step: 1,
        initial: 0,
        uniform: pathOffset,
      },
      {
        id: 'remnant-orbit',
        kind: 'number',
        label: '轨道着色',
        description: '降低迭代轨道对银灰与金色混色的影响；零值保留红色基底和光脉冲。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 1,
        uniform: orbitAmount,
      },
      {
        id: 'remnant-shadow',
        kind: 'number',
        label: '阴影强度',
        description: '比较双光源的未遮挡照明与距离估计阴影；零值仍保留表面明暗和高光。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 1,
        uniform: shadowAmount,
      },
      {
        id: 'remnant-glow',
        kind: 'number',
        label: '近面辉光',
        description: '放大射线贴近表面时积累的蓝色辉光；这是艺术化距离累积，不是体积散射。',
        min: 0,
        max: 3,
        step: 0.1,
        initial: 1,
        uniform: glowAmount,
      },
    ],
  };
};

export default createShader;
