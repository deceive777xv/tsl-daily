// glowingMarblingBlack — nasana (WtdXR8).
// CC BY-NC-SA 3.0 based on the approved historical mirror. See case LICENSE.md.
import * as THREE from 'three/webgpu';
import {
  Fn,
  Loop,
  abs,
  clamp,
  cos,
  float,
  int,
  max,
  min,
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
  const layers = uniform(9);
  const warp = uniform(0.6);
  const frequency = uniform(1);
  const glow = uniform(0.1);
  const elapsed = float(context.time as unknown as number)
    .mul(speed)
    .add(7);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const colorNode = Fn(() => {
    // The shorter viewport dimension defines one unit on both axes.
    const p = uv().mul(2).sub(1).mul(resolution).div(min(resolution.x, resolution.y)).toVar();
    Loop({ start: int(1), end: int(layers).add(1), type: 'int', condition: '<' }, ({ i }) => {
      const index = float(i);
      const weight = warp.div(index);
      p.x.addAssign(weight.mul(cos(index.mul(2.5).mul(frequency).mul(p.y).add(elapsed))));
      // Keep these assignments separate: y must read the newly updated x.
      p.y.addAssign(weight.mul(cos(index.mul(1.5).mul(frequency).mul(p.x).add(elapsed))));
    });
    // Guard the reciprocal singularity; values above one already clip to white.
    const brightness = glow.div(max(abs(sin(elapsed.sub(p.y).sub(p.x))), 0.0001));
    // The original writes display-space gray; avoid a second sRGB encoding.
    return sRGBTransferEOTF(vec3(clamp(brightness, 0, 1))) as THREE.Node<'vec3'>;
  })();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  return {
    material,
    controls: [
      {
        id: 'marbling-speed',
        kind: 'number',
        label: '流动速度',
        description: '同时推进坐标扭曲和亮纹相位；零值回到原作第 7 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'marbling-layers',
        kind: 'number',
        label: '扭曲层数',
        description: '从一层看清弯曲，再增加细纹；默认九层与原作一致。',
        min: 1,
        max: 12,
        step: 1,
        initial: 9,
        uniform: layers,
      },
      {
        id: 'marbling-warp',
        kind: 'number',
        label: '扭曲幅度',
        description: '每层位移为幅度除以层号；零值留下笔直的对角亮纹。',
        min: 0,
        max: 1.2,
        step: 0.05,
        initial: 0.6,
        uniform: warp,
      },
      {
        id: 'marbling-frequency',
        kind: 'number',
        label: '细纹频率',
        description: '共同缩放两轴余弦频率，保留原作 2.5 与 1.5 的比例。',
        min: 0.5,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: frequency,
      },
      {
        id: 'marbling-glow',
        kind: 'number',
        label: '亮纹宽度',
        description: '提高倒数亮度的分子，扩大白色条带，也抬高暗部。',
        min: 0.03,
        max: 0.2,
        step: 0.01,
        initial: 0.1,
        uniform: glow,
      },
    ],
  };
};
export default createShader;
