// Hot and Cold Crustacean — TheGrego (ltXyzS).
// CC BY-NC-SA 3.0 based on the approved historical mirror. See case LICENSE.md.
import * as THREE from 'three/webgpu';
import {
  Fn,
  clamp,
  cos,
  float,
  length,
  max,
  mix,
  mod,
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
  const twist = uniform(0.5);
  const detail = uniform(4);
  const frequency = uniform(5);
  const compression = uniform(1);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(7);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    // The source origin is the lower center, not the center of the screen.
    const p = uv().mul(2).sub(vec2(1, 0)).toVar();
    p.x.mulAssign(resolution.x.div(resolution.y));
    const radius = length(p).toVar();
    const angle = radius.mul(twist);
    const c = cos(angle);
    const s = sin(angle);
    // Source p *= mat2(c,s,-s,c) is row-vector multiplication, clockwise.
    p.assign(vec2(p.x.mul(c).add(p.y.mul(s)), p.y.mul(c).sub(p.x.mul(s))));
    p.mulAssign(p.div(max(radius, 0.000001)).mul(detail));
    const color = vec3(0).toVar();
    // Unroll exactly three channels while retaining their shared mutable p.
    for (const [channel, component] of ['x', 'y', 'z'].entries()) {
      const fold = length(mod(p, 0.5).sub(p.x.mul(0.25))).toVar();
      p.y.mulAssign(
        sin(fold.mul(frequency))
          .mul(0.5)
          .mul(
            sin(time.sub(length(p).mul(0.5)))
              .add(Math.PI)
              .mul(0.4),
          )
          .mul(compression),
      );
      // pow(0,0) is undefined on some backends; the first exponent is zero.
      const phase = channel === 0 ? float(1) : pow(length(p), channel * 0.25);
      color[component as 'x' | 'y' | 'z'].assign(cos(time.add(phase)));
    }
    // pow(p.y, 1.0) is just p.y, including negative values. Keep the mix
    // factor unbounded: extrapolation and final RGB clipping shape the image.
    const displayRGB = mix(color, vec3(p.y.mul(0.5)), length(p).mul(0.5));
    return sRGBTransferEOTF(clamp(displayRGB, 0, 1)) as THREE.Node<'vec3'>;
  })();
  return {
    material,
    controls: [
      {
        id: 'crustacean-speed',
        kind: 'number',
        label: '流动速度',
        description: '推进坐标压缩和冷暖变化的时间；零值停在原作第 7 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'crustacean-twist',
        kind: 'number',
        label: '径向扭转',
        description: '让旋转角度随半径增长；零值展开未经旋转的坐标。',
        min: 0,
        max: 1.25,
        step: 0.05,
        initial: 0.5,
        uniform: twist,
      },
      {
        id: 'crustacean-detail',
        kind: 'number',
        label: '纹理细度',
        description: '缩放扭转后的坐标，观察壳纹疏密与外侧色区如何一起改变。',
        min: 1,
        max: 7,
        step: 0.25,
        initial: 4,
        uniform: detail,
      },
      {
        id: 'crustacean-frequency',
        kind: 'number',
        label: '褶皱频率',
        description: '改变周期距离进入正弦的倍率；高值产生更细的条纹。',
        min: 1,
        max: 8,
        step: 0.25,
        initial: 5,
        uniform: frequency,
      },
      {
        id: 'crustacean-compression',
        kind: 'number',
        label: '纵向压缩',
        description: '缩放每个通道对纵坐标的乘数，后续通道继承该变化。',
        min: 0.5,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: compression,
      },
    ],
  };
};

export default createShader;
