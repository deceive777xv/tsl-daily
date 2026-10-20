/*
 * Particle Experiment 7 — Stephane Cuillerdier / Aiekick (MddGWN), 2015.
 * CC BY-NC-SA 3.0, including this TSL adaptation; see the case LICENSE.md.
 * Explicit grant in the user-approved historical mirror snapshot.
 */
import * as THREE from 'three/webgpu';
import {
  Fn,
  Loop,
  clamp,
  cos,
  dot,
  float,
  fract,
  int,
  length,
  max,
  mix,
  sin,
  smoothstep,
  sRGBTransferEOTF,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const count = uniform(100);
  const spread = uniform(4);
  const zoom = uniform(6);
  const glow = uniform(1);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(7);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const point = uv().mul(2).sub(1).mul(resolution).div(resolution.y).mul(zoom).toVar();
    const total = float(0).toVar();
    const blendedColor = vec3(0).toVar();
    const evolution = sin(time.mul(0.01).add(400)).mul(0.5).add(0.5).mul(99).add(1);
    const groupSize = int(max(evolution, 1)).toVar();
    const particleCount = int(count).toVar();
    Loop({ start: int(0), end: particleCount, type: 'int', condition: '<' }, ({ i }) => {
      // Both operands are integers: neighboring indices share a radial phase.
      const group = float(i.div(groupSize)).toVar();
      const cycle = fract(
        time
          .add(5)
          .mul(0.51)
          .add(sin(group.mul(692.7398)).mul(48934.4238)),
      ).toVar();
      const angle = float(i).mul(6.28).div(float(particleCount));
      const center = vec2(cos(angle), sin(angle)).mul(cycle).mul(spread);
      const relative = point.sub(center).toVar();
      const ratio = cycle.div(spread).toVar();
      const radius = mix(0.84, 1.6, ratio);
      // The original reciprocal is singular exactly at a particle center.
      const contribution = radius.div(max(dot(relative, relative), 0.000001)).toVar();
      total.addAssign(contribution);
      const particleColor = mix(vec3(0, 0.64, 0.2), vec3(0.06, 0.35, 0.85), ratio);
      blendedColor.assign(mix(blendedColor, particleColor, contribution.div(total)));
    });
    const energy = total.div(float(particleCount)).toVar();
    const hue = blendedColor.div(max(length(blendedColor), 0.000001));
    // Explicit descending cubic replaces the source's reversed smoothstep edges.
    const taper = float(1).sub(smoothstep(0, 1, clamp(energy, 0, 0.4)));
    const displayRGB = clamp(hue.mul(energy).mul(taper).mul(glow), 0, 1);
    return sRGBTransferEOTF(displayRGB) as THREE.Node<'vec3'>;
  })();
  return {
    material,
    controls: [
      {
        id: 'particle-speed',
        kind: 'number',
        label: '扩散速度',
        description: '推进径向循环和缓慢变化的分组；零值固定在原作第 7 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'particle-count',
        kind: 'number',
        label: '粒子数量',
        description: '改变参与光场叠加的粒子数，也改变每个像素的循环次数。',
        min: 24,
        max: 160,
        step: 1,
        initial: 100,
        uniform: count,
      },
      {
        id: 'particle-spread',
        kind: 'number',
        label: '扩散范围',
        description: '设置径向循环的外沿，同时保留原作用它计算颜色权重的关系。',
        min: 2,
        max: 8,
        step: 0.1,
        initial: 4,
        uniform: spread,
      },
      {
        id: 'particle-zoom',
        kind: 'number',
        label: '取景尺度',
        description: '数值越大，同一画幅容纳的场景范围越大，光点看起来越小。',
        min: 3,
        max: 10,
        step: 0.1,
        initial: 6,
        uniform: zoom,
      },
      {
        id: 'particle-glow',
        kind: 'number',
        label: '辉光强度',
        description: '只缩放最终 RGB 亮度，不改变粒子位置或相位分组。',
        min: 0.5,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: glow,
      },
    ],
  };
};
export default createShader;
