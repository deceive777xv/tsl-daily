// Shader Art Coding Introduction — kishimisu (mtyGWy).
// CC BY-NC-SA 3.0 based on the historical Shadertoy mirror; see the case LICENSE.md.
// Cosine palette independently expressed from the mathematical concept credited to IQ.
import * as THREE from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  abs,
  clamp,
  cos,
  exp,
  float,
  fract,
  length,
  max,
  pow,
  sin,
  sRGBTransferEOTF,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const layers = uniform(4);
  const tiling = uniform(1.5);
  const frequency = uniform(8);
  const glow = uniform(1);
  const elapsed = float(context.time as unknown as number)
    .mul(speed)
    .add(2);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const colorNode = Fn(() => {
    // Height-based coordinates preserve circles on both portrait and landscape screens.
    const original = uv()
      .mul(2)
      .sub(1)
      .mul(vec2(resolution.x.div(resolution.y), 1))
      .toVar();
    const position = original.toVar();
    const radius = length(original).toVar();
    const color = vec3(0).toVar();
    Loop(6, ({ i }) => {
      If(float(i).lessThan(layers), () => {
        // Mutating the previous coordinate makes this recursive, not six independent grids.
        position.assign(fract(position.mul(tiling)).sub(0.5));
        const distance = length(position).mul(exp(radius.negate()));
        const phase = radius.add(float(i).mul(0.4)).add(elapsed.mul(0.4));
        // Three phase-shifted cosine channels; no article source or assets are imported.
        const palette = cos(
          vec3(phase)
            .add(vec3(0.263, 0.416, 0.557))
            .mul(6.28318),
        )
          .mul(0.5)
          .add(0.5);
        const ring = abs(sin(distance.mul(frequency).add(elapsed)).div(frequency));
        // The source divides by zero at ring centers. Bound only that singularity.
        const light = pow(glow.mul(0.01).div(max(ring, 0.0001)), 1.2);
        color.addAssign(palette.mul(light));
      });
    });
    // Shadertoy RGB is display-encoded; decode once before the site's sRGB output.
    return sRGBTransferEOTF(clamp(color, 0, 1)) as THREE.Node<'vec3'>;
  })();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  return {
    material,
    controls: [
      {
        id: 'art-speed',
        kind: 'number',
        label: '流动速度',
        description: '控制光环和色彩共同推进的速度；零值固定在初始相位。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'art-layers',
        kind: 'number',
        label: '递归层数',
        description: '逐层叠加平铺坐标，观察细节如何从一层增长到六层。',
        min: 1,
        max: 6,
        step: 1,
        initial: 4,
        uniform: layers,
      },
      {
        id: 'art-tiling',
        kind: 'number',
        label: '平铺倍率',
        description: '每次递归缩放坐标的倍率；原作使用 1.5。',
        min: 1.1,
        max: 2,
        step: 0.05,
        initial: 1.5,
        uniform: tiling,
      },
      {
        id: 'art-frequency',
        kind: 'number',
        label: '光环频率',
        description: '调整距离波的频率，观察一格里亮环的数量和间隔。',
        min: 4,
        max: 12,
        step: 0.25,
        initial: 8,
        uniform: frequency,
      },
      {
        id: 'art-glow',
        kind: 'number',
        label: '辉光宽度',
        description: '以原作为一倍，提高反幂亮度的分子，让光晕变宽。',
        min: 0.3,
        max: 1.8,
        step: 0.1,
        initial: 1,
        uniform: glow,
      },
    ],
  };
};
export default createShader;
