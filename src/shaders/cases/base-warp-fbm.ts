import * as THREE from 'three/webgpu';
import {
  clamp,
  dot,
  float,
  floor,
  fract,
  mix,
  select,
  sin,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';

import type { ShaderFactory } from '../types';

type FloatNode = THREE.Node<'float'>;
type Vec2Node = THREE.Node<'vec2'>;

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const scale = uniform(1);
  const warp = uniform(1);
  const contrast = uniform(1);
  const time = float(context.time as unknown as number).mul(speed);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);

  const random = (point: Vec2Node) => fract(sin(dot(point, vec2(12.9898, 4.1414))).mul(43758.5453));

  const noise = (point: Vec2Node) => {
    const cell = floor(point);
    const local = fract(point);
    const blend = local.mul(local).mul(float(3).sub(local.mul(2)));
    const bottom = mix(random(cell), random(cell.add(vec2(1, 0))), blend.x);
    const top = mix(random(cell.add(vec2(0, 1))), random(cell.add(vec2(1, 1))), blend.x);
    const value = mix(bottom, top, blend.y);
    return value.mul(value);
  };

  const rotateAndScale = (point: Vec2Node, frequency: number) =>
    vec2(point.x.mul(0.8).sub(point.y.mul(0.6)), point.x.mul(0.6).add(point.y.mul(0.8))).mul(
      frequency,
    );

  const fbm = (point: Vec2Node) => {
    const p1 = rotateAndScale(point, 2.02);
    const p2 = rotateAndScale(p1, 2.01);
    const p3 = rotateAndScale(p2, 2.03);
    const p4 = rotateAndScale(p3, 2.01);
    const p5 = rotateAndScale(p4, 2.04);
    return noise(point.add(time))
      .mul(0.5)
      .add(noise(p1).mul(0.03125))
      .add(noise(p2).mul(0.25))
      .add(noise(p3).mul(0.125))
      .add(noise(p4).mul(0.0625))
      .add(noise(p5.add(sin(time))).mul(0.015625))
      .div(0.96875);
  };

  const pattern = (point: Vec2Node) => {
    const inner = fbm(point);
    const middle = fbm(point.add(vec2(inner).mul(warp)));
    return fbm(point.add(vec2(middle).mul(warp)));
  };

  const rose = (value: FloatNode) => {
    const red = select(
      value.lessThan(0),
      54 / 255,
      select(value.lessThan(20049 / 82979), value.mul(829.79).add(54.51).div(255), 1),
    );
    const green = select(
      value.lessThan(20049 / 82979),
      0,
      select(
        value.lessThan(327013 / 810990),
        value
          .mul(8546482679670 / 10875673217)
          .sub(2064961390770 / 10875673217)
          .div(255),
        select(
          value.lessThanEqual(1),
          value
            .mul(103806720 / 483977)
            .add(19607415 / 483977)
            .div(255),
          1,
        ),
      ),
    );
    const blue = select(
      value.lessThan(0),
      54 / 255,
      select(
        value.lessThan(7249 / 82979),
        value.mul(829.79).add(54.51).div(255),
        select(
          value.lessThan(20049 / 82979),
          127 / 255,
          select(
            value.lessThan(327013 / 810990),
            value.mul(792.022493413614).sub(64.36479073560233).div(255),
            1,
          ),
        ),
      ),
    );
    return vec3(red, green, blue);
  };

  const point = uv().mul(resolution).div(resolution.x).mul(scale);
  const shade = clamp(pattern(point).sub(0.5).mul(contrast).add(0.5), 0, 1);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = rose(shade);

  return {
    material,
    controls: [
      {
        id: 'warp-speed',
        kind: 'number',
        label: '速度',
        description: '参与首尾噪声层的时间推进倍率。',
        min: 0.05,
        max: 1.5,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'warp-scale',
        kind: 'number',
        label: '尺度',
        description: '初始 UV 的放大倍数。',
        min: 0.5,
        max: 3,
        step: 0.05,
        initial: 1,
        uniform: scale,
      },
      {
        id: 'warp-strength',
        kind: 'number',
        label: '扭曲',
        description: '噪声值反馈到坐标的强度。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: warp,
      },
      {
        id: 'warp-contrast',
        kind: 'number',
        label: '对比度',
        description: '围绕中灰重映射最终噪声值。',
        min: 0.5,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: contrast,
      },
    ],
  };
};

export default createShader;
