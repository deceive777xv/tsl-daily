// Branchless Voxel Raycasting — fb39ca4 (4dX3zl).
// CC BY-NC-SA 3.0 based on the approved historical mirror.
// DDA lineage: Lode Vandevenne, BSD-2-Clause; see case LICENSE.md and upstream/.
// Preserve the original acknowledgment of kzy's axis-mask suggestion.
import * as THREE from 'three/webgpu';
import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  clamp,
  cos,
  float,
  floor,
  length,
  max,
  min,
  mix,
  sRGBTransferEOTF,
  sign,
  sin,
  step,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type F = THREE.Node<'float'>;
type V3 = THREE.Node<'vec3'>;

// The distance formulas decide occupancy at each cell center. They are not
// the distances used to advance the ray; DDA advances to grid boundaries.
const occupied = Fn(([cell, cellSize, cavity]: [V3, F, F]) => {
  const point = cell.add(0.5).mul(cellSize).toVar();
  const edge = abs(point).sub(6);
  const box = min(max(edge.x, max(edge.y, edge.z)), 0).add(length(max(edge, 0)));
  const carvedBox = max(cavity.sub(length(point)), box);
  const enclosure = float(25).sub(length(point));
  return min(carvedBox, enclosure).lessThan(0);
}).setLayout({
  name: 'voxelOccupied',
  type: 'bool',
  inputs: [
    { name: 'cell', type: 'vec3' },
    { name: 'cellSize', type: 'float' },
    { name: 'cavity', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const cellSize = uniform(1);
  const cavity = uniform(7.5);
  const focus = uniform(0.8);
  const contrast = uniform(1);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(2);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const screen = uv().mul(2).sub(1);
    const c = cos(time);
    const s = sin(time);
    // Rotate the source camera and its rays together in the xz plane.
    const origin = vec3(s.mul(12), sin(time.mul(2.7)).mul(2), c.mul(-12));
    const direction = vec3(
      screen.x.mul(c).sub(focus.mul(s)),
      screen.y.mul(resolution.y).div(resolution.x),
      focus.mul(c).add(screen.x.mul(s)),
    ).toVar();
    const gridOrigin = origin.div(cellSize).toVar();
    const cell = floor(gridOrigin).toVar();
    const rayStep = sign(direction).toVar();
    // A parallel axis must never win the next-boundary comparison. Keeping
    // delta finite also avoids the original 0 * Infinity at aligned rays.
    const delta = vec3(length(direction))
      .div(max(abs(direction), 0.000001))
      .toVar();
    const side = rayStep
      .mul(cell.sub(gridOrigin))
      .add(rayStep.mul(0.5))
      .add(0.5)
      .mul(delta)
      .toVar();
    const mask = vec3(0).toVar();
    Loop(64, () => {
      If(occupied(cell, cellSize, cavity), () => {
        // The source continues without changing state after a hit. Stopping
        // here preserves the result while avoiding its remaining no-op work.
        Break();
      });
      // step(edge, value) produces the source's component-wise <= mask as
      // numeric 0/1, including ties, without backend-specific boolean casts.
      mask.assign(step(side, min(side.yzx, side.zxy)));
      side.addAssign(mask.mul(delta));
      cell.addAssign(mask.mul(rayStep));
    });
    // Preserve the source's face priority: y overrides x, z overrides both.
    const face = mix(float(0.5).add(mask.y.mul(0.5)), 0.75, mask.z);
    const displayGray = clamp(face.sub(0.75).mul(contrast).add(0.75), 0, 1);
    return sRGBTransferEOTF(vec3(displayGray)) as V3;
  })();
  return {
    material,
    controls: [
      {
        id: 'voxel-speed',
        kind: 'number',
        label: '环绕速度',
        description: '改变相机环绕与上下摆动的时间倍率；零值回到原作第 2 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'voxel-cell-size',
        kind: 'number',
        label: '体素边长',
        description: '改变采样网格的粗细；球与方盒的世界尺寸保持固定。',
        min: 0.5,
        max: 2,
        step: 0.1,
        initial: 1,
        uniform: cellSize,
      },
      {
        id: 'voxel-cavity',
        kind: 'number',
        label: '挖空半径',
        description: '从方盒内部挖去更大的球，观察体素轮廓怎样改变。',
        min: 6.3,
        max: 10,
        step: 0.1,
        initial: 7.5,
        uniform: cavity,
      },
      {
        id: 'voxel-focus',
        kind: 'number',
        label: '透视焦距',
        description: '改变射线的前向分量；数值越大，视野越窄。',
        min: 0.5,
        max: 1.4,
        step: 0.05,
        initial: 0.8,
        uniform: focus,
      },
      {
        id: 'voxel-contrast',
        kind: 'number',
        label: '朝向对比',
        description: '缩放三种面的灰度差；零值消除依靠明暗辨认的立体感。',
        min: 0,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: contrast,
      },
    ],
  };
};

export default createShader;
