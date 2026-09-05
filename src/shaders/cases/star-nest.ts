// Star Nest by Pablo Roman Andrioli (Kali) — MIT License.
// TSL port for TSL Daily from the approved XlfGRj mirror snapshot.
import * as THREE from 'three/webgpu';
import {
  Fn,
  Loop,
  abs,
  cos,
  dot,
  float,
  length,
  max,
  mix,
  mod,
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
  const zoom = uniform(0.8);
  const tile = uniform(0.85);
  const brightness = uniform(1);
  const saturation = uniform(0.85);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .mul(0.01)
    .add(0.25);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const pointer = vec2(context.pointer as unknown as THREE.Vector2).sub(0.5);

  const rotate = (value: Vec2Node, angle: FloatNode) => {
    const cosine = cos(angle);
    const sine = sin(angle);
    return vec2(
      value.x.mul(cosine).sub(value.y.mul(sine)),
      value.x.mul(sine).add(value.y.mul(cosine)),
    );
  };

  const colorNode = Fn(() => {
    const centeredUv = uv().sub(0.5);
    const screen = vec2(centeredUv.x, centeredUv.y.mul(resolution.y.div(resolution.x)));
    const angleXZ = float(0.5).add(pointer.x.mul(2));
    const angleXY = float(0.8).add(pointer.y.mul(2));

    const initialDirection = vec3(screen.mul(zoom), 1);
    const directionXZ = rotate(vec2(initialDirection.x, initialDirection.z), angleXZ);
    const directionAfterXZ = vec3(directionXZ.x, initialDirection.y, directionXZ.y);
    const directionXY = rotate(directionAfterXZ.xy, angleXY);
    const direction = vec3(directionXY, directionAfterXZ.z);

    const initialOrigin = vec3(1, 0.5, 0.5).add(vec3(time.mul(2), time, -2));
    const originXZ = rotate(vec2(initialOrigin.x, initialOrigin.z), angleXZ);
    const originAfterXZ = vec3(originXZ.x, initialOrigin.y, originXZ.y);
    const originXY = rotate(originAfterXZ.xy, angleXY);
    const origin = vec3(originXY, originAfterXZ.z);

    const sampleDepth = float(0.1).toVar();
    const fade = float(1).toVar();
    const accumulated = vec3(0).toVar();

    Loop(20, ({ i }) => {
      const point = origin.add(direction.mul(sampleDepth).mul(0.5)).toVar();
      point.assign(abs(vec3(tile).sub(mod(point, vec3(tile.mul(2))))));

      const previousLength = float(0).toVar();
      const activity = float(0).toVar();

      Loop(17, () => {
        point.assign(
          abs(point)
            .div(max(dot(point, point), 0.0001))
            .sub(0.53),
        );
        const currentLength = length(point);
        activity.addAssign(abs(currentLength.sub(previousLength)));
        previousLength.assign(currentLength);
      });

      const darkMatter = max(float(0), float(0.3).sub(activity.mul(activity).mul(0.001)));
      activity.assign(activity.mul(activity).mul(activity));
      const depthColor = vec3(
        sampleDepth,
        sampleDepth.mul(sampleDepth),
        sampleDepth.mul(sampleDepth).mul(sampleDepth).mul(sampleDepth),
      );

      fade.mulAssign(select(float(i).greaterThan(6), float(1).sub(darkMatter), 1));
      accumulated.addAssign(vec3(fade));
      accumulated.addAssign(depthColor.mul(activity).mul(brightness).mul(0.0015).mul(fade));
      fade.mulAssign(0.73);
      sampleDepth.addAssign(0.1);
    });

    return mix(vec3(length(accumulated)), accumulated, saturation).mul(0.01);
  })();

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;

  return {
    material,
    controls: [
      {
        id: 'star-nest-speed',
        kind: 'number',
        label: '漂移速度',
        description: '控制视点穿过分形空间的推进速度。',
        min: 0.1,
        max: 3,
        step: 0.1,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'star-nest-zoom',
        kind: 'number',
        label: '视野缩放',
        description: '改变屏幕坐标进入视线方向时的尺度。',
        min: 0.4,
        max: 1.4,
        step: 0.05,
        initial: 0.8,
        uniform: zoom,
      },
      {
        id: 'star-nest-tile',
        kind: 'number',
        label: '折叠尺度',
        description: '决定空间镜像折叠单元的大小。',
        min: 0.5,
        max: 1.2,
        step: 0.01,
        initial: 0.85,
        uniform: tile,
      },
      {
        id: 'star-nest-brightness',
        kind: 'number',
        label: '星云亮度',
        description: '放大分形活动量在体积积分中的发光贡献。',
        min: 0.3,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: brightness,
      },
      {
        id: 'star-nest-saturation',
        kind: 'number',
        label: '色彩分离',
        description: '在灰度星雾与按深度着色的星云之间混合。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 0.85,
        uniform: saturation,
      },
    ],
  };
};

export default createShader;
