// crumpledWave — nasana (3ttSzr).
// CC BY-NC-SA 3.0 based on the approved historical mirror. See case LICENSE.md.
import * as THREE from 'three/webgpu';
import {
  Fn,
  Loop,
  clamp,
  float,
  int,
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
  const layers = uniform(7);
  const amplitude = uniform(0.1);
  const frequency = uniform(1);
  const colorOffset = uniform(0);
  const phase = float(context.time as unknown as number)
    .mul(speed)
    .add(7)
    .mul(0.5);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const p = uv().mul(2).sub(1).mul(resolution).div(min(resolution.x, resolution.y)).toVar();
    Loop({ start: int(1), end: int(layers).add(1), type: 'int', condition: '<' }, ({ i }) => {
      const index = float(i);
      const band = index.mul(index).mul(frequency);
      // Every layer reads the y written by the previous layer; x stays fixed.
      p.y.addAssign(
        amplitude.mul(sin(p.x.mul(band).add(phase))).mul(sin(p.y.mul(band).add(phase))),
      );
    });
    // The source's i * 0.1 / i is a constant amplitude, not a declining weight.
    const height = p.y.add(colorOffset);
    const displayRGB = clamp(vec3(height.sub(0.1), height.add(0.3), height.add(0.95)), 0, 1);
    // Match the source's display RGB before the shared renderer encodes sRGB.
    return sRGBTransferEOTF(displayRGB) as THREE.Node<'vec3'>;
  })();
  return {
    material,
    controls: [
      {
        id: 'crumpled-speed',
        kind: 'number',
        label: '流动速度',
        description: '推进两组正弦的相位；零值回到原作第 7 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'crumpled-layers',
        kind: 'number',
        label: '折叠层数',
        description: '逐层增加细褶皱；默认七层，后续频率按层号平方增长。',
        min: 1,
        max: 12,
        step: 1,
        initial: 7,
        uniform: layers,
      },
      {
        id: 'crumpled-amplitude',
        kind: 'number',
        label: '褶皱幅度',
        description: '控制每层纵向位移；零值显示未经扭曲的蓝色渐变。',
        min: 0,
        max: 0.2,
        step: 0.01,
        initial: 0.1,
        uniform: amplitude,
      },
      {
        id: 'crumpled-frequency',
        kind: 'number',
        label: '褶皱频率',
        description: '共同缩放两组正弦频率；高值更细密，也更容易产生锯齿。',
        min: 0.5,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: frequency,
      },
      {
        id: 'crumpled-color-offset',
        kind: 'number',
        label: '色带位置',
        description: '只移动最终高度到颜色的映射，保留褶皱形状。',
        min: -0.4,
        max: 0.4,
        step: 0.02,
        initial: 0,
        uniform: colorOffset,
      },
    ],
  };
};
export default createShader;
