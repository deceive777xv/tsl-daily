// Lens Flare Example — mu6k (4sX3Rs), Unlicense / public domain.
// Original credits Shane for the seam fix. See the case LICENSE.md.
// The input noise is generated here; no Shadertoy texture is fetched or copied.
import * as THREE from 'three/webgpu';
import {
  Fn,
  atan,
  clamp,
  cos,
  float,
  length,
  max,
  mix,
  pow,
  sin,
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
type V3 = THREE.Node<'vec3'>;

function createNoise(): THREE.DataTexture {
  const bytes = new Uint8Array(256 * 256 * 4);
  let seed = 123456789;
  // Fixed xorshift32 seed: build once, never regenerate on a frame or parameter change.
  for (let i = 0; i < bytes.length; i++) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    bytes[i] = seed & 255;
  }
  const noise = new THREE.DataTexture(bytes, 256, 256);
  noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
  noise.magFilter = THREE.LinearFilter;
  noise.minFilter = THREE.LinearMipmapLinearFilter;
  noise.generateMipmaps = true;
  noise.needsUpdate = true;
  return noise;
}

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const exposure = uniform(1);
  const ghosts = uniform(1);
  const dispersion = uniform(1);
  const rays = uniform(1);
  const elapsed = float(context.time as unknown as number);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const pointer = vec2(context.pointer as unknown as THREE.Vector2);
  const noise = createNoise();
  const colorNode = Fn(() => {
    const screen = uv();
    const aspect = resolution.x.div(resolution.y);
    const p = screen.sub(0.5).mul(vec2(aspect, 1)).toVar();
    const t = elapsed.mul(speed).add(0.7);
    // Portrait fitting keeps the automatic light inside the narrower horizontal field.
    const light = vec2(
      sin(t)
        .mul(0.5)
        .mul(clamp(aspect, 0, 1)),
      sin(t.mul(0.913)).mul(0.5),
    )
      .add(pointer.sub(0.5).mul(vec2(aspect, 1)))
      .toVar();
    const main = p.sub(light).toVar();
    // atan(0, 0) is undefined on some GPUs: protect just the light's center.
    const angle = atan(main.x, main.y.add(length(main).lessThan(0.000001).select(0.000001, 0)));
    const distance = pow(length(main), 0.1);
    const noiseCoordinate = sin(angle.mul(2).add(light.x))
      .mul(4)
      .sub(cos(angle.mul(3).add(light.y)));
    // Noise is numeric data (NoColorSpace); UV and mip filtering match the old input contract.
    const angularNoise = texture(noise, vec2(noiseCoordinate, 0).div(256)).r;
    const core = float(1).div(length(main).mul(16).add(1));
    const modulation = sin(angularNoise.mul(16)).mul(0.1).add(distance.mul(0.1)).add(0.8);
    const glow = core.mul(float(1).add(mix(float(0.9), modulation, rays)));
    const warped = p.mul(length(p)).toVar();
    const wide = mix(p, warped, -0.5).toVar();
    const tight = mix(p, warped, -0.4).toVar();
    // JS builds three fixed RGB expressions, not a GPU loop. All distances stay radial.
    // Dispersion changes positions, not channel gains: zero aligns each RGB ghost center.
    const ghostChannel = (index: number) => {
      const shift = float(index).mul(dispersion);
      const soft = float([0.25, 0.23, 0.21][index]!).div(
        pow(length(warped.add(light.mul(float(0.8).add(shift.mul(0.05))))), 2)
          .mul(32)
          .add(1),
      );
      const disk = (coords: V2, offset: F, power: number, gain: number) =>
        max(float(0.01).sub(pow(length(coords.add(light.mul(offset))), power)), 0).mul(gain);
      return soft
        .add(disk(wide, float(0.4).add(shift.mul(0.05)), 2.4, [6, 5, 3][index]!))
        .add(disk(tight, float(0.2).add(shift.mul(0.2)), 5.5, 2))
        .add(disk(wide, float(-0.3).sub(shift.mul(0.025)), 1.6, [6, 3, 5][index]!));
    };
    const flare = vec3(ghostChannel(0), ghostChannel(1), ghostChannel(2))
      .mul(1.3)
      .mul(ghosts)
      .sub(length(warped).mul(0.05))
      .add(glow);
    const grain = texture(noise, screen.mul(resolution).div(256)).r.mul(0.015);
    const color = flare
      .mul(vec3(1.4, 1.2, 1))
      .sub(grain)
      .toVar();
    const sum = color.r.add(color.g).add(color.b);
    const graded = mix(color, vec3(sum).mul(0.5), sum.mul(0.1)).mul(exposure);
    return sRGBTransferEOTF(clamp(graded, 0, 1)) as V3;
  })();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  material.addEventListener('dispose', () => noise.dispose());
  return {
    material,
    controls: [
      {
        id: 'flare-speed',
        kind: 'number',
        label: '运动速度',
        description: '改变光源轨迹的速度；零值固定在初始时刻。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'flare-exposure',
        kind: 'number',
        label: '整体亮度',
        description: '观察光晕和暗部层次；高值会扩大高光区域。',
        min: 0.3,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: exposure,
      },
      {
        id: 'flare-ghosts',
        kind: 'number',
        label: '鬼影强度',
        description: '仅改变镜头鬼影的强度，保留主光源。',
        min: 0,
        max: 3,
        step: 0.1,
        initial: 1,
        uniform: ghosts,
      },
      {
        id: 'flare-dispersion',
        kind: 'number',
        label: '色散距离',
        description: '拉开鬼影的 RGB 中心；零值重合中心但保留通道亮度差。',
        min: 0,
        max: 3,
        step: 0.1,
        initial: 1,
        uniform: dispersion,
      },
      {
        id: 'flare-rays',
        kind: 'number',
        label: '星芒起伏',
        description: '改变角度噪声对光晕的调制；零值成为均匀径向光晕。',
        min: 0,
        max: 2,
        step: 0.1,
        initial: 1,
        uniform: rays,
      },
    ],
  };
};
export default createShader;
