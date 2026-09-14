// Pretty Hip — Hadyn (XsBfRW), CC BY-NC-SA 3.0 based on the historical mirror.
// Combines Hadyn's tiled wave with the site owner's supplied dark square-ring variant.
// See src/data/shaders/pretty-hip/LICENSE.md for source evidence and modifications.
import * as THREE from 'three/webgpu';
import {
  Fn,
  abs,
  clamp,
  float,
  floor,
  fract,
  fwidth,
  length,
  max,
  min,
  mix,
  mod,
  pow,
  sin,
  smoothstep,
  sRGBTransferEOTF,
  step,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const density = uniform(16);
  const spacing = uniform(1.5);
  const style = uniform(0.9);
  const grid = uniform(0.6);
  const elapsed = float(context.time as unknown as number)
    .mul(speed)
    .add(2.5);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const colorNode = Fn(() => {
    const centered = uv()
      .sub(0.5)
      .mul(vec2(1, resolution.y.div(resolution.x)))
      .toVar();
    // Equivalent to the row-vector mat2 rotation in the user's GLSL, with y up.
    const rotated = vec2(centered.x.add(centered.y), centered.y.sub(centered.x)).div(Math.SQRT2);
    const cellPosition = rotated.mul(density).add(0.5).toVar();
    const local = fract(cellPosition).toVar();
    const cell = floor(cellPosition).toVar();
    const radialDistance = length(cell);
    const border = min(
      min(local.x, float(1).sub(local.x)),
      min(local.y, float(1).sub(local.y)),
    ).mul(2);

    // User variant: a band between two smooth thresholds, delayed per cell.
    const distance = pow(float(1).sub(border), 2);
    const phase = elapsed
      .mul(0.5)
      .sub(radialDistance.mul(spacing))
      .add(cell.x.sub(cell.y).mul(0.05));
    // pow(negative, 0.4) is undefined in GLSL. Keep the inactive half-cycle at zero.
    const edge = pow(max(sin(phase), 0), 0.4);
    // Keep the user's two zero-crossing contours, but smooth over pixels rather than
    // a fixed fraction of a cell. Large diamonds must not acquire wider soft edges.
    const ringField = distance.mul(1.2).toVar();
    const pixelWidth = max(fwidth(ringField).mul(0.5), 0.00001);
    const inner = edge.sub(0.4);
    const outer = edge.sub(0.25);
    const enters = smoothstep(inner.sub(pixelWidth), inner.add(pixelWidth), ringField);
    const leaves = smoothstep(outer.sub(pixelWidth), outer.add(pixelWidth), ringField);
    const outsideRing = float(1).sub(enters.mul(float(1).sub(leaves)));

    // Hadyn's original uses cells offset by half the grid width, not centered cells.
    const originalPosition = rotated.add(0.5).mul(density).toVar();
    const originalLocal = fract(originalPosition).toVar();
    const originalBorder = min(
      min(originalLocal.x, float(1).sub(originalLocal.x)),
      min(originalLocal.y, float(1).sub(originalLocal.y)),
    ).mul(2);
    const originalRadius = length(floor(originalPosition).add(0.5).sub(density.mul(0.5)));
    const saw = fract(elapsed.sub(originalRadius.mul(spacing.div(3))).mul(0.25)).mul(2);
    const folded = fract(originalBorder.mul(2));
    const inverted = mix(folded, float(1).sub(folded), step(1, saw));
    const threshold = pow(abs(float(1).sub(saw)), 2);
    const originalValue = smoothstep(threshold.sub(0.05), threshold, inverted.mul(0.95)).add(
      originalRadius.mul(0.1),
    );
    const originalColor = mix(vec3(1), vec3(0.5, 0.75, 1), originalValue);

    const gridPosition = centered.mul(80).toVar();
    const gridDistance = abs(fract(gridPosition).sub(0.5));
    const gridWidth = max(fwidth(gridPosition), vec2(0.001));
    const gridLines = smoothstep(vec2(0.4).sub(gridWidth), vec2(0.4).add(gridWidth), gridDistance);
    const background = mix(
      vec3(0.1, 0.2, 0.35),
      vec3(0.1, 0.15, 0.25),
      max(gridLines.x, gridLines.y).mul(grid),
    );
    const cobaltRegion = step(8.0001, cell.y.sub(cell.x));
    const secondary = mix(vec3(0.9), vec3(0, 0.05, 0.8), cobaltRegion);
    const parity = float(1).sub(step(0.01, mod(cell.x.add(cell.y), 2)));
    const ringColor = mix(secondary, vec3(0.2, 0.65, 0.85), parity);
    const darkColor = mix(ringColor, background, outsideRing);
    // Keep both readings visible at the default; endpoints expose each source direction.
    // Source RGB is display-encoded. Alpha is deliberately opaque, not CineShader metadata.
    return sRGBTransferEOTF(
      clamp(mix(originalColor, darkColor, style), 0, 1),
    ) as THREE.Node<'vec3'>;
  })();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  return {
    material,
    controls: [
      {
        id: 'hip-speed',
        kind: 'number',
        label: '波纹速度',
        description: '改变时间推进速度，零值停在初始相位。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'hip-density',
        kind: 'number',
        label: '方格密度',
        description: '改变横向方格数量；原作参考为 10，默认融合版为 16。',
        min: 8,
        max: 24,
        step: 1,
        initial: 16,
        uniform: density,
      },
      {
        id: 'hip-spacing',
        kind: 'number',
        label: '相位间隔',
        description: '改变相邻径向位置的延迟，观察波纹如何变密。',
        min: 0.5,
        max: 2.5,
        step: 0.05,
        initial: 1.5,
        uniform: spacing,
      },
      {
        id: 'hip-style',
        kind: 'number',
        label: '原作／改版',
        description: '零值显示浅色填充波纹，一值显示深色方环，默认融合两者。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 0.9,
        uniform: style,
      },
      {
        id: 'hip-grid',
        kind: 'number',
        label: '底纹对比',
        description: '改变深色细网格的对比；原作端点不显示底纹。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 0.6,
        uniform: grid,
      },
    ],
  };
};
export default createShader;
