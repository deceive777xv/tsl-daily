import * as THREE from 'three/webgpu';
import { abs, float, length, max, mod, sin, uniform, uv, vec2, vec3 } from 'three/tsl';

import type { ShaderFactory } from '../types';

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const warp = uniform(1);
  const glow = uniform(0.01);
  const time = float(context.time as unknown as number).mul(speed);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const baseUv = uv();
  const centered = baseUv.sub(0.5).mul(vec2(resolution.x.div(resolution.y), 1));
  const radius = max(length(centered), 0.0001);

  const channel = (phaseOffset: number) => {
    const phase = time.add(phaseOffset);
    const wave = sin(phase)
      .add(1)
      .mul(abs(sin(radius.mul(9).sub(phase.mul(2)))))
      .mul(warp);
    const warpedUv = baseUv.add(centered.div(radius).mul(wave));
    const cellDistance = max(length(mod(warpedUv, 1).sub(0.5)), 0.0001);
    return glow.div(cellDistance).div(radius);
  };

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = vec3(channel(0.07), channel(0.14), channel(0.21));

  return {
    material,
    controls: [
      {
        id: 'creation-speed',
        kind: 'number',
        label: '速度',
        description: '时间推进倍率。',
        min: 0.05,
        max: 2.5,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'creation-warp',
        kind: 'number',
        label: '扭曲',
        description: '径向波对 UV 的位移强度。',
        min: 0,
        max: 1.8,
        step: 0.05,
        initial: 1,
        uniform: warp,
      },
      {
        id: 'creation-glow',
        kind: 'number',
        label: '辉光',
        description: '网格距离倒数的亮度系数。',
        min: 0.002,
        max: 0.024,
        step: 0.001,
        initial: 0.01,
        uniform: glow,
      },
    ],
  };
};

export default createShader;
