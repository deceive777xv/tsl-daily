// I/O — movAX13h, August 2013 (XsfGDS).
// CC BY-NC-SA 3.0 based on the approved historical mirror. See case LICENSE.md.
// User-approved monochrome, silent adaptation: no audio or external texture.
import * as THREE from 'three/webgpu';
import {
  Fn,
  Loop,
  abs,
  clamp,
  cos,
  float,
  floor,
  fract,
  hash,
  int,
  length,
  max,
  sign,
  smoothstep,
  sRGBTransferEOTF,
  uint,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const count = uniform(70);
  const glow = uniform(0.65);
  const pulse = uniform(0.35);
  const depth = uniform(0.7);
  const elapsed = float(context.time as unknown as number)
    .mul(speed)
    .add(2.5);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const colorNode = Fn(() => {
    const screen = uv().sub(0.5).toVar();
    const aspect = resolution.x.div(resolution.y);
    // Fit the complete two-column composition into portrait without stretching blocks.
    const fit = aspect.lessThan(1).select(aspect, 1);
    const p = screen.mul(vec2(aspect, 1)).div(fit).toVar();
    const layoutAspect = max(aspect, 1);
    const gray = float(0.28);
    const color = pulse
      .mul(gray)
      .mul(0.5)
      .mul(float(0.9).sub(cos(screen.x.mul(8))))
      .toVar();
    Loop({ start: int(0), end: int(count), type: 'int', condition: '<' }, ({ i }) => {
      // Integer seeds avoid amplifying backend-dependent sine rounding.
      const index = float(i);
      const z = float(1)
        .sub(depth.mul(hash(uint(i).add(1))))
        .toVar();
      const tickTime = elapsed.mul(z).mul(0.7).add(index.mul(1.23753)).toVar();
      const tick = floor(tickTime);
      const randomX = hash(uint(tick).add(123));
      const x = randomX.sub(0.5).mul(layoutAspect).mul(0.6).toVar();
      x.addAssign(sign(x).mul(0.24));
      // Preserve the original zero-sign guard.
      x.addAssign(abs(x).lessThan(0.1).select(1, 0));
      const y = sign(p.x)
        .mul(1.6)
        .mul(float(0.5).sub(fract(tickTime)));
      const height = hash(uint(tick).add(917)).mul(0.1).add(0.04);
      const size = vec2(0.04, height).mul(z).mul(1.8);
      const b = length(max(abs(p.sub(vec2(x, y))).sub(size), vec2(0))).sub(0.01);
      // GLSL smoothstep requires increasing edges. Write the original inverse
      // ramps explicitly and guard the variable denominator in the shine term.
      const dust = float(1)
        .sub(smoothstep(0, 0.22, b))
        .mul(z)
        .mul(pulse)
        .mul(0.5)
        .mul(glow);
      const block = float(1)
        .sub(smoothstep(0, 0.002, b))
        .mul(z)
        .mul(0.2);
      const shineRamp = b
        .greaterThan(-0.002)
        .select(clamp(float(0.009).div(max(b.add(0.002), 0.00001)), 0, 1), 0);
      const shine = shineRamp
        .mul(shineRamp)
        .mul(float(3).sub(shineRamp.mul(2)))
        .mul(z)
        .mul(pulse)
        .mul(0.6)
        .mul(glow);
      color.addAssign(dust.mul(gray).add(block.mul(z)).add(shine));
    });
    const pixel = floor(uv().mul(resolution));
    const grain = hash(uint(pixel.x).add(uint(pixel.y).mul(4096))).mul(0.04);
    // One scalar is broadcast to RGB: all five controls stay strictly monochrome.
    return sRGBTransferEOTF(vec3(clamp(color.sub(grain), 0, 1))) as THREE.Node<'vec3'>;
  })();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  return {
    material,
    controls: [
      {
        id: 'io-speed',
        kind: 'number',
        label: '流动速度',
        description: '近层比远层更快；零值固定初始画面。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'io-count',
        kind: 'number',
        label: '方块数量',
        description: '减少数量，逐个看清方块和重叠；数量越多计算越重。',
        min: 20,
        max: 100,
        step: 1,
        initial: 70,
        uniform: count,
      },
      {
        id: 'io-glow',
        kind: 'number',
        label: '柔光强度',
        description: '仅改变光晕和亮边；零值保留方块实体。',
        min: 0,
        max: 1.2,
        step: 0.05,
        initial: 0.65,
        uniform: glow,
      },
      {
        id: 'io-pulse',
        kind: 'number',
        label: '亮度脉冲',
        description: '手动代替原作音频振幅；零值仅显示方块，不读取声音。',
        min: 0,
        max: 0.8,
        step: 0.05,
        initial: 0.35,
        uniform: pulse,
      },
      {
        id: 'io-depth',
        kind: 'number',
        label: '景深差异',
        description: '同时改变随机层的尺寸、速度和亮度；零值使层次趋于一致。',
        min: 0,
        max: 0.9,
        step: 0.05,
        initial: 0.7,
        uniform: depth,
      },
    ],
  };
};
export default createShader;
