/*
 * Spout — P_Malin (lsXGzH), historical mirror / CC BY-NC-SA 3.0.
 * This TSL adaptation uses the same license; see the case LICENSE.md.
 * iChannel0 is replaced by a new deterministic local brick texture.
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
  exp,
  exp2,
  float,
  length,
  max,
  min,
  mix,
  normalize,
  pow,
  reflect,
  refract,
  sin,
  step,
  sRGBTransferEOTF,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type F = THREE.Node<'float'>;
type V3 = THREE.Node<'vec3'>;
type V4 = THREE.Node<'vec4'>;

function createBricks(): THREE.DataTexture {
  const size = 256;
  const bytes = new Uint8Array(size * size * 4);
  let seed = 0x7319ab;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / 32);
      const mortar = (x + (row % 2) * 32) % 64 < 2 || y % 32 < 2;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = (seed / 4294967296 - 0.5) * 12;
      const base = mortar ? [90, 86, 78] : [154, 113, 82];
      const offset = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) bytes[offset + c] = base[c]! + grain;
      bytes[offset + 3] = 255;
    }
  }
  const bricks = new THREE.DataTexture(bytes, size, size);
  bricks.colorSpace = THREE.NoColorSpace;
  bricks.wrapS = bricks.wrapT = THREE.RepeatWrapping;
  bricks.minFilter = THREE.LinearMipmapLinearFilter;
  bricks.magFilter = THREE.LinearFilter;
  bricks.generateMipmaps = true;
  bricks.flipY = false;
  bricks.needsUpdate = true;
  return bricks;
}

const merge = Fn(([a, b]: [V4, V4]) => mix(a, b, step(b.x, a.x))).setLayout({
  name: 'spoutUnion',
  type: 'vec4',
  inputs: [
    { name: 'a', type: 'vec4' },
    { name: 'b', type: 'vec4' },
  ],
});

const sky = Fn(([direction]: [V3]) =>
  mix(vec3(0.35, 0.4, 0.5), vec3(0.7, 0.8, 1), clamp(direction.y, 0, 1)),
).setLayout({ name: 'spoutSky', type: 'vec3', inputs: [{ name: 'direction', type: 'vec3' }] });

const atmosphere = Fn(([color, direction, distance]: [V3, V3, F]) => {
  const towardLight = normalize(vec3(0.2, 0.3, -0.5));
  const flare = pow(clamp(dot(towardLight, direction), 0, 1), 10);
  const fog = sky(direction).add(vec3(8, 7.5, 7).mul(flare));
  return mix(fog, color, exp(distance.mul(-0.05)));
}).setLayout({
  name: 'spoutAtmosphere',
  type: 'vec3',
  inputs: [
    { name: 'color', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'distance', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    flow = uniform(1),
    ripples = uniform(1);
  const refraction = uniform(1),
    framing = uniform(1);
  const ior = refraction.mul(0.333).add(1);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(2);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const bricks = createBricks();

  // x = signed distance; y = material ID; zw = the original material UV.
  // mode 1 finds the water entrance, 0 its exit, and -1 ignores water.
  const field = Fn(([p, mode]: [V3, F]) => {
    const trench = length(p.yz.add(vec2(-0.4, 0))).sub(1);
    const masonry = min(max(p.y, trench.negate()), p.x.add(1));
    const result = vec4(masonry, 1, p.x.add(p.y), p.z).toVar();
    const domain = p.sub(vec3(0, 2, 0)).toVar();
    const travel = max(domain.x.div(flow), 0).toVar();
    // s = 1/2 a t², with a = -1. Domain bending makes a falling jet.
    domain.y.addAssign(travel.mul(travel).mul(0.5));
    const water = length(domain.yz).sub(0.4).toVar();
    const pipe = max(max(water.sub(0.15), domain.x), water.negate());
    result.assign(merge(result, vec4(pipe, 2, p.xy)));
    water.divAssign(travel.mul(0.5).add(1));
    const inTrench = step(p.y, -0.05).toVar();
    const noiseDomain = p.xz.toVar();
    noiseDomain.x.assign(mix(p.x, length(p.xz.sub(vec2(flow.mul(2), 0))), inTrench));
    const amplitude = mix(travel.mul(travel), float(1).div(noiseDomain.x.add(1)), inTrench)
      .mul(0.025)
      .mul(ripples)
      .toVar();
    const waterSpeed = mix(flow.mul(80), float(20), inTrench);
    noiseDomain.mulAssign(30);
    noiseDomain.x.subAssign(time.mul(waterSpeed));
    const waves = sin(noiseDomain.mul(0.6345)).add(sin(noiseDomain.mul(1.62423)));
    const noise = dot(waves, vec2(0.125)).add(0.5);
    water.assign(min(water, p.y.add(0.1)).add(noise.mul(amplitude)));
    const waterData = vec4(water.mul(mode.mul(2).sub(1)), 3, p.xy);
    return mix(result, waterData, step(waterData.x, result.x).mul(step(0, mode)));
  }).setLayout({
    name: 'spoutField',
    type: 'vec4',
    inputs: [
      { name: 'p', type: 'vec3' },
      { name: 'mode', type: 'float' },
    ],
  });

  const normal = Fn(([p, mode]: [V3, F]) => {
    const a = vec3(0.025, -0.025, -0.025),
      b = vec3(-0.025, -0.025, 0.025);
    const c = vec3(-0.025, 0.025, -0.025),
      d = vec3(0.025, 0.025, 0.025);
    const gradient = a
      .mul(field(p.add(a), mode).x)
      .add(b.mul(field(p.add(b), mode).x))
      .add(c.mul(field(p.add(c), mode).x))
      .add(d.mul(field(p.add(d), mode).x))
      .toVar();
    return gradient.div(max(length(gradient), 1e-8));
  }).setLayout({
    name: 'spoutNormal',
    type: 'vec3',
    inputs: [
      { name: 'p', type: 'vec3' },
      { name: 'mode', type: 'float' },
    ],
  });

  // xyz is the last evaluated position, w the final traveled distance.
  // Preserve the original's inclusive 0..32 loop and last-step ordering.
  const march = Fn(([origin, direction, start, limit, mode]: [V3, V3, F, F, F]) => {
    const distance = start.toVar(),
      position = origin.toVar();
    Loop(33, () => {
      position.assign(origin.add(direction.mul(distance)));
      const scene = field(position, mode).toVar();
      If(abs(scene.x).lessThanEqual(0.01).or(distance.greaterThanEqual(limit)), () => {
        Break();
      });
      distance.addAssign(scene.x);
    });
    If(distance.greaterThanEqual(limit), () => {
      distance.assign(1000);
      position.assign(origin.add(direction.mul(1000)));
    });
    return vec4(position, distance);
  }).setLayout({
    name: 'spoutMarch',
    type: 'vec4',
    inputs: [
      { name: 'origin', type: 'vec3' },
      { name: 'direction', type: 'vec3' },
      { name: 'start', type: 'float' },
      { name: 'limit', type: 'float' },
      { name: 'mode', type: 'float' },
    ],
  });

  const shade = Fn(
    ([position, n, view, data, reflection, transmission]: [V3, V3, V3, V4, V3, V3]) => {
      const albedo = vec3(0.5).toVar(),
        roughReflection = float(0.8).toVar();
      const smoothness = float(1).toVar(),
        transparency = float(0).toVar();
      If(data.y.lessThan(1.5), () => {
        const sampled = texture(bricks, data.zw.mul(0.25)).rgb.toVar();
        albedo.assign(sampled.mul(sampled));
        smoothness.assign(albedo.r);
        roughReflection.assign(0.02);
      }).ElseIf(data.y.greaterThan(2.5), () => {
        albedo.assign(vec3(1.4, 0.6, 0.2));
        roughReflection.assign(0.01);
        transparency.assign(1);
      });
      const towardLight = normalize(vec3(0.2, 0.3, -0.5)).toVar();
      const bias = float(0.05).div(max(abs(dot(towardLight, n)), 1e-6));
      const shadowHit = march(position, towardLight, bias, float(10).sub(bias), float(-1));
      const shadow = step(0, shadowHit.w).mul(step(10, shadowHit.w));
      const light = vec3(8, 7.5, 7)
        .mul(shadow)
        .mul(max(dot(towardLight, n), 0))
        .toVar();
      const ao = float(1).toVar();
      Loop(6, ({ i }) => {
        const distance = float(i).add(1).mul(0.1).toVar();
        const objectDistance = field(position.add(n.mul(distance)), float(-1)).x;
        ao.mulAssign(float(1).sub(max(distance.sub(objectDistance).mul(0.2).div(distance), 0)));
      });
      const halfLight = normalize(towardLight.sub(view));
      const exponent = exp2(smoothness.mul(6).add(4)).toVar();
      const highlight = pow(max(dot(n, halfLight), 0), exponent)
        .mul(exponent.add(2))
        .mul(0.125);
      const diffuse = sky(n).mul(ao).add(light).mul(albedo);
      const specular = reflection.add(light.mul(highlight));
      const reflected = reflect(view, n).toVar();
      const halfView = reflected.sub(view).toVar();
      halfView.divAssign(max(length(halfView), 1e-8));
      const grazing = pow(clamp(float(1).sub(dot(halfView, view.negate())), 0, 1), 5);
      const fresnel = roughReflection.add(
        float(1).sub(roughReflection).mul(grazing).mul(smoothness.mul(0.9).add(0.1)),
      );
      return mix(mix(diffuse, transmission, transparency), specular, fresnel);
    },
  ).setLayout({
    name: 'spoutShade',
    type: 'vec3',
    inputs: [
      { name: 'position', type: 'vec3' },
      { name: 'n', type: 'vec3' },
      { name: 'view', type: 'vec3' },
      { name: 'data', type: 'vec4' },
      { name: 'reflection', type: 'vec3' },
      { name: 'transmission', type: 'vec3' },
    ],
  });

  // Secondary rays see opaque objects and the sky. There is no recursive TSL call.
  const secondary = Fn(([origin, direction, start, limit]: [V3, V3, F, F]) => {
    const hit = march(origin, direction, start, limit, float(-1)).toVar();
    const color = sky(direction).toVar();
    If(hit.w.lessThan(1000), () => {
      const data = field(hit.xyz, float(-1)).toVar();
      const n = normal(hit.xyz, float(-1)).toVar();
      color.assign(shade(hit.xyz, n, direction, data, sky(reflect(direction, n)), vec3(0)));
    });
    return atmosphere(color, direction, hit.w);
  }).setLayout({
    name: 'spoutSecondary',
    type: 'vec3',
    inputs: [
      { name: 'origin', type: 'vec3' },
      { name: 'direction', type: 'vec3' },
      { name: 'start', type: 'float' },
      { name: 'limit', type: 'float' },
    ],
  });

  const primary = Fn(([origin, direction]: [V3, V3]) => {
    const hit = march(origin, direction, float(0), float(30), float(1)).toVar();
    const color = sky(direction).toVar();
    If(hit.w.lessThan(1000), () => {
      const data = field(hit.xyz, float(1)).toVar(),
        n = normal(hit.xyz, float(1)).toVar();
      const reflected = reflect(direction, n).toVar();
      const reflectBias = float(0.1).div(max(abs(dot(reflected, n)), 1e-6));
      const reflectedColor = secondary(hit.xyz, reflected, reflectBias, float(16)).toVar();
      const transmitted = vec3(0).toVar();
      If(data.y.greaterThan(2.5), () => {
        const inside = refract(direction, n, float(1).div(ior)).toVar();
        If(length(inside).greaterThan(1e-7), () => {
          const bias = float(0.05).div(max(abs(dot(inside, n)), 1e-6));
          const exit = march(hit.xyz, inside, bias, float(16), float(0)).toVar();
          const exitNormal = normal(exit.xyz, float(0)).toVar();
          const outside = refract(inside, exitNormal, ior).toVar();
          // Preserve the original's zero-vector secondary path at total internal
          // reflection; it does not trace repeated internal reflections.
          const beyond = secondary(exit.xyz, outside, float(0), float(16));
          const extinction = vec3(1).div(vec3(1).add(vec3(1.4, 0.6, 0.2).mul(exit.w)));
          transmitted.assign(beyond.mul(extinction));
        });
      });
      color.assign(shade(hit.xyz, n, direction, data, reflectedColor, transmitted));
    });
    return atmosphere(color, direction, hit.w);
  }).setLayout({
    name: 'spoutPrimary',
    type: 'vec3',
    inputs: [
      { name: 'origin', type: 'vec3' },
      { name: 'direction', type: 'vec3' },
    ],
  });

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    // Original default orbit: heading mix(-.5, pi+.5, .2), elevation .1.
    const heading = mix(float(-0.5), float(3.141592654).add(0.5), float(0.2));
    const elevation = mix(float(1.5), float(-0.25), float(0.8));
    const distance = mix(float(4), float(2.5), float(0.8));
    const offset = vec3(
      sin(heading).mul(cos(elevation)),
      sin(elevation),
      cos(heading).mul(cos(elevation)),
    ).mul(distance);
    const origin = vec3(1, 0.9, 0).add(offset).toVar();
    const forwards = normalize(vec3(1, 0.9, 0).sub(origin)).toVar();
    const right = normalize(cross(forwards, vec3(0, 1, 0))).toVar();
    const up = cross(right, forwards).toVar();
    const aspect = resolution.x.div(resolution.y);
    const screen = uv()
      .mul(2)
      .sub(1)
      .mul(vec2(1, float(1).div(aspect)))
      .mul(framing)
      .toVar();
    const direction = normalize(right.mul(screen.x).add(up.mul(screen.y)).add(forwards));
    const lit = primary(origin, direction).toVar();
    const display = vec3(1).sub(exp2(lit.mul(-1.5)));
    return sRGBTransferEOTF(clamp(display, 0, 1)) as V3;
  })();
  material.addEventListener('dispose', () => bricks.dispose());
  return {
    material,
    controls: [
      {
        id: 'spout-speed',
        kind: 'number',
        label: '波纹速度',
        description: '缩放波纹随时间的流动，零值固定在原作第 2 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'spout-flow',
        kind: 'number',
        label: '出水速度',
        description: '改变抛物线的水平速度，观察落点与水柱曲率。',
        min: 0.7,
        max: 1.3,
        step: 0.05,
        initial: 1,
        uniform: flow,
      },
      {
        id: 'spout-ripples',
        kind: 'number',
        label: '波纹幅度',
        description: '缩放水柱和水槽的表面扰动，比较法线与反光。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: ripples,
      },
      {
        id: 'spout-refraction',
        kind: 'number',
        label: '折射强度',
        description: '强度 1 对应原作折射率 1.333；零值与空气一致，单独比较两次折射的方向。',
        min: 0,
        max: 1.8,
        step: 0.05,
        initial: 1,
        uniform: refraction,
      },
      {
        id: 'spout-framing',
        kind: 'number',
        label: '取景宽度',
        description: '缩放相机视野，默认保持原作的静态相机。',
        min: 0.8,
        max: 1.4,
        step: 0.05,
        initial: 1,
        uniform: framing,
      },
    ],
  };
};
export default createShader;
