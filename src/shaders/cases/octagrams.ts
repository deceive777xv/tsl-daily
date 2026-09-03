import * as THREE from 'three/webgpu';
import {
  Fn,
  Loop,
  abs,
  cos,
  exp,
  float,
  length,
  max,
  min,
  mod,
  normalize,
  sin,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';

import type { ShaderFactory } from '../types';

type FloatNode = THREE.Node<'float'>;
type Vec2Node = THREE.Node<'vec2'>;
type Vec3Node = THREE.Node<'vec3'>;

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const repeatSize = uniform(4);
  const glowFalloff = uniform(23);
  const stepScale = uniform(0.55);
  const time = float(context.time as unknown as number).mul(speed);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);

  const rotate = (value: Vec2Node, angle: FloatNode) => {
    const cosine = cos(angle);
    const sine = sin(angle);
    return vec2(
      value.x.mul(cosine).sub(value.y.mul(sine)),
      value.x.mul(sine).add(value.y.mul(cosine)),
    );
  };

  const boxDistance = (point: Vec3Node, bounds: Vec3Node) => {
    const q = abs(point).sub(bounds);
    return length(max(q, 0)).add(min(max(q.x, max(q.y, q.z)), 0));
  };

  const box = (point: Vec3Node, scale: FloatNode) =>
    boxDistance(point.mul(scale), vec3(0.4, 0.4, 0.1))
      .div(1.5)
      .negate();

  const sceneDistance = (point: Vec3Node, phase: FloatNode) => {
    const offset = sin(phase.mul(0.4)).mul(2.5);
    const scale = float(2).sub(abs(sin(phase.mul(0.4))).mul(1.5));

    const transformed = (x: FloatNode, y: FloatNode) => {
      const rotated = rotate(vec2(point.x.add(x), point.y.add(y)), float(0.8));
      return vec3(rotated, point.z);
    };

    const box1 = box(transformed(float(0), offset), scale);
    const box2 = box(transformed(float(0), offset.negate()), scale);
    const box3 = box(transformed(offset, float(0)), scale);
    const box4 = box(transformed(offset.negate(), float(0)), scale);
    const centerRotated = rotate(point.xy, float(0.8));
    const box5 = box(vec3(centerRotated, point.z), float(0.5)).mul(6);
    const box6 = box(point, float(0.5)).mul(6);
    return max(max(max(max(max(box1, box2), box3), box4), box5), box6);
  };

  const colorNode = Fn(() => {
    const screen = uv().mul(resolution).mul(2).sub(resolution).div(min(resolution.x, resolution.y));
    const origin = vec3(0, -0.2, time.mul(4));
    const initialRay = normalize(vec3(screen, 1.5));
    const rayXY = rotate(initialRay.xy, sin(time.mul(0.03)).mul(5));
    const rayYZ = rotate(vec2(rayXY.y, initialRay.z), sin(time.mul(0.05)).mul(0.2));
    const ray = vec3(rayXY.x, rayYZ.x, rayYZ.y);
    const travel = float(0.1).toVar();
    const accumulation = float(0).toVar();

    Loop(99, ({ i }) => {
      const halfRepeat = repeatSize.mul(0.5);
      const position = mod(origin.add(ray.mul(travel)).sub(halfRepeat), repeatSize).sub(halfRepeat);
      const phase = time.sub(float(i).mul(0.01));
      const distance = max(abs(sceneDistance(position, phase)), 0.01);
      accumulation.addAssign(exp(distance.negate().mul(glowFalloff)));
      travel.addAssign(distance.mul(stepScale));
    });

    const base = vec3(0, abs(sin(time)).mul(0.2), sin(time).mul(0.2).add(0.5));
    return vec3(accumulation.mul(0.02)).add(base);
  })();

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;

  return {
    material,
    controls: [
      {
        id: 'octagrams-speed',
        kind: 'number',
        label: '速度',
        description: '统一控制相机前进与几何呼吸。',
        min: 0.05,
        max: 1.8,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'octagrams-repeat',
        kind: 'number',
        label: '重复间距',
        description: '空间折叠单元的边长。',
        min: 2.8,
        max: 6,
        step: 0.1,
        initial: 4,
        uniform: repeatSize,
      },
      {
        id: 'octagrams-falloff',
        kind: 'number',
        label: '辉光衰减',
        description: '距离表面越远时，能量衰减得多快。',
        min: 10,
        max: 36,
        step: 1,
        initial: 23,
        uniform: glowFalloff,
      },
      {
        id: 'octagrams-step',
        kind: 'number',
        label: '步进系数',
        description: '每次按距离前进的比例。',
        min: 0.3,
        max: 0.9,
        step: 0.05,
        initial: 0.55,
        uniform: stepScale,
      },
    ],
  };
};

export default createShader;
