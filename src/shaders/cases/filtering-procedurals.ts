/*
 * Filtering procedurals — Inigo Quilez / iq (MdjGR1).
 * Copyright © 2013 Inigo Quilez
 * Copyright (c) 2026 TSL Daily contributors (TSL adaptation)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * https://www.shadertoy.com/view/MdjGR1
 * Explicit MIT based on the approved historical mirror; see case LICENSE.md.
 */
import * as THREE from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  abs,
  clamp,
  cos,
  cross,
  dot,
  exp,
  float,
  fract,
  int,
  length,
  max,
  min,
  mix,
  mod,
  normalize,
  pow,
  reflect,
  sRGBTransferEOTF,
  sin,
  smoothstep,
  sqrt,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type F = THREE.Node<'float'>;
type I = THREE.Node<'int'>;
type V3 = THREE.Node<'vec3'>;
type V4 = THREE.Node<'vec4'>;

const spheres = [
  [0, 1, 0, 1],
  [0, 1, 14, 4],
  [-11, 1, 12, 4],
  [13, 1, -10, 4],
] as const;

const hashGradient = Fn(([point]: [V3]) =>
  fract(
    sin(
      vec3(
        dot(point, vec3(127.1, 311.7, 74.7)),
        dot(point, vec3(269.5, 183.3, 246.1)),
        dot(point, vec3(113.5, 271.9, 124.6)),
      ),
    ).mul(13.5453123),
  )
    .mul(2)
    .sub(1),
).setLayout({
  name: 'filteringHashGradient',
  type: 'vec3',
  inputs: [{ name: 'point', type: 'vec3' }],
});

const gradientNoise = Fn(([point]: [V3]) => {
  const cell = point.floor().toVar();
  const local = fract(point).toVar();
  const weight = local
    .mul(local)
    .mul(vec3(3).sub(local.mul(2)))
    .toVar();
  const corner = (x: number, y: number, z: number) => {
    const offset = vec3(x, y, z);
    return dot(hashGradient(cell.add(offset)), local.sub(offset));
  };
  return mix(
    mix(
      mix(corner(0, 0, 0), corner(1, 0, 0), weight.x),
      mix(corner(0, 1, 0), corner(1, 1, 0), weight.x),
      weight.y,
    ),
    mix(
      mix(corner(0, 0, 1), corner(1, 0, 1), weight.x),
      mix(corner(0, 1, 1), corner(1, 1, 1), weight.x),
      weight.y,
    ),
    weight.z,
  );
}).setLayout({
  name: 'filteringGradientNoise',
  type: 'float',
  inputs: [{ name: 'point', type: 'vec3' }],
});

const materialAt = Fn(([coordinates, material]: [V3, F]) => {
  const point = coordinates.add(0.1).toVar();
  const cell = point.div(20).floor().toVar();
  const local = fract(point.div(20).add(0.5));
  const id = mix(fract(sin(dot(cell, vec3(127.1, 311.7, 74.7))).mul(58.5453123)), 0.3, material);
  const alternate = mod(cell.x.add(mod(cell.y.add(mod(cell.z, 2)), 2)), 2);
  const stretch = mix(
    vec3(alternate.mul(0.8).add(0.2), 1, float(1).sub(alternate.mul(0.8))),
    vec3(1),
    material,
  );
  const grain = gradientNoise(point.mul(stretch)).add(0.5);
  const seams = smoothstep(0.03, 0.04, abs(local.x.sub(0.5)).div(0.5)).mul(
    smoothstep(0.03, 0.04, abs(local.z.sub(0.5)).div(0.5)),
  );
  const palette = sin(vec3(0, 1, 2).add(id.mul(2)).add(1))
    .mul(0.5)
    .add(0.5);
  return palette.mul(grain).mul(mix(seams, 1, material));
}).setLayout({
  name: 'filteringMaterialAt',
  type: 'vec3',
  inputs: [
    { name: 'coordinates', type: 'vec3' },
    { name: 'material', type: 'float' },
  ],
});

const sphereDistance = Fn(([origin, direction, sphere]: [V3, V3, V4]) => {
  const offset = origin.sub(sphere.xyz);
  const b = dot(direction, offset);
  const discriminant = b.mul(b).sub(dot(offset, offset).sub(sphere.w.mul(sphere.w)));
  const distance = float(-1).toVar();
  If(discriminant.greaterThan(0), () => {
    distance.assign(b.negate().sub(sqrt(discriminant)));
  });
  return distance;
}).setLayout({
  name: 'filteringSphereDistance',
  type: 'float',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'sphere', type: 'vec4' },
  ],
});

const sphereOcclusion = Fn(([sphere, position]: [V4, V3]) => {
  const offset = sphere.xyz.sub(position);
  const distance = length(offset);
  return float(1).sub(
    offset.y.div(distance).mul(sphere.w.mul(sphere.w)).div(distance.mul(distance)),
  );
}).setLayout({
  name: 'filteringSphereOcclusion',
  type: 'float',
  inputs: [
    { name: 'sphere', type: 'vec4' },
    { name: 'position', type: 'vec3' },
  ],
});

// Pack (distance, material ID, sphere index or -1 for the plane, occlusion).
const intersectScene = Fn(([origin, direction]: [V3, V3]) => {
  const result = vec4(10000, 0, -1, 1).toVar();
  const plane = origin.y.negate().div(direction.y).toVar();
  If(plane.greaterThan(0), () => {
    const position = origin.add(direction.mul(plane)).toVar();
    const occlusion = float(1).toVar();
    for (const sphere of spheres) occlusion.mulAssign(sphereOcclusion(vec4(...sphere), position));
    result.assign(vec4(plane, 0, -1, occlusion));
  });
  spheres.forEach((sphere, index) => {
    const shape = vec4(...sphere);
    const distance = sphereDistance(origin, direction, shape).toVar();
    If(distance.greaterThan(0).and(distance.lessThan(result.x)), () => {
      const normal = normalize(origin.add(direction.mul(distance)).sub(shape.xyz));
      result.assign(vec4(distance, 1, index, normal.y.mul(0.5).add(0.5)));
    });
  });
  return result;
}).setLayout({
  name: 'filteringIntersectScene',
  type: 'vec4',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
  ],
});

const hitNormal = Fn(([position, sphereIndex]: [V3, F]) => {
  const normal = vec3(0, 1, 0).toVar();
  spheres.forEach((sphere, index) => {
    If(sphereIndex.equal(index), () => {
      normal.assign(normalize(position.sub(vec3(sphere[0], sphere[1], sphere[2]))));
    });
  });
  return normal;
}).setLayout({
  name: 'filteringHitNormal',
  type: 'vec3',
  inputs: [
    { name: 'position', type: 'vec3' },
    { name: 'sphereIndex', type: 'float' },
  ],
});

const softSphereShadow = Fn(([position, sphere]: [V3, V4]) => {
  const offset = sphere.xyz.sub(position);
  const b = dot(offset, vec3(0.57703)).toVar();
  const shadow = float(1).toVar();
  If(b.greaterThan(0), () => {
    const h = dot(offset, offset).sub(b.mul(b)).sub(sphere.w.mul(sphere.w));
    shadow.assign(smoothstep(0, 1, h.mul(2).div(b)));
  });
  return shadow;
}).setLayout({
  name: 'filteringSoftSphereShadow',
  type: 'float',
  inputs: [
    { name: 'position', type: 'vec3' },
    { name: 'sphere', type: 'vec4' },
  ],
});

const lightAt = Fn(([position, normal, occlusion, direction]: [V3, V3, F, V3]) => {
  const shadow = float(1).toVar();
  for (const sphere of spheres)
    shadow.assign(min(shadow, softSphereShadow(position, vec4(...sphere))));
  const diffuse = clamp(dot(normal, vec3(0.57703)), 0, 1);
  const back = clamp(dot(normal, vec3(-0.707, 0, -0.707)), 0, 1);
  const specular = pow(clamp(dot(reflect(direction, normal), vec3(0.57703)), 0, 1), 12);
  return vec3(1.5, 1.4, 1.3)
    .mul(diffuse)
    .mul(shadow)
    .add(vec3(0.15, 0.2, 0.3).mul(occlusion))
    .add(vec3(0.2).mul(back))
    .add(shadow.mul(specular).mul(0.8));
}).setLayout({
  name: 'filteringLightAt',
  type: 'vec3',
  inputs: [
    { name: 'position', type: 'vec3' },
    { name: 'normal', type: 'vec3' },
    { name: 'occlusion', type: 'float' },
    { name: 'direction', type: 'vec3' },
  ],
});

// Only material evaluation is repeated; visibility and lighting stay outside.
const filteredMaterial = Fn(
  ([coordinates, deltaX, deltaY, material, cap, footprint]: [V3, V3, V3, F, I, F]) => {
    const maximum = float(cap).sub(1);
    const countX = int(clamp(length(deltaX).mul(footprint), 0, maximum))
      .add(1)
      .toVar();
    const countY = int(clamp(length(deltaY).mul(footprint), 0, maximum))
      .add(1)
      .toVar();
    const sum = vec3(0).toVar();
    Loop(
      { start: int(0), end: countY, type: 'int', condition: '<' },
      { start: int(0), end: countX, type: 'int', condition: '<' },
      ({ i: sampleY, j: sampleX }) => {
        const offset = deltaX
          .mul(float(sampleX).div(float(countX)))
          .add(deltaY.mul(float(sampleY).div(float(countY))));
        sum.addAssign(materialAt(coordinates.add(offset), material));
      },
    );
    return sum.div(float(countX.mul(countY)));
  },
).setLayout({
  name: 'filteringFilteredMaterial',
  type: 'vec3',
  inputs: [
    { name: 'coordinates', type: 'vec3' },
    { name: 'deltaX', type: 'vec3' },
    { name: 'deltaY', type: 'vec3' },
    { name: 'material', type: 'float' },
    { name: 'cap', type: 'int' },
    { name: 'footprint', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1);
  const scale = uniform(64);
  const samples = uniform(10);
  const footprint = uniform(4);
  const split = uniform(0.5);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(7);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const colorNode = Fn(() => {
    const angle = time.mul(0.1);
    const origin = vec3(cos(angle).mul(5.5), 1, sin(angle).mul(5.5)).toVar();
    const forward = normalize(vec3(0, 1, 0).sub(origin)).toVar();
    const right = normalize(cross(forward, vec3(0, 1, 0))).toVar();
    const up = normalize(cross(right, forward)).toVar();
    const pixel = uv().mul(resolution);
    const coordinate = pixel.mul(2).sub(resolution).div(resolution.y).toVar();
    const direction = normalize(
      right.mul(coordinate.x).add(up.mul(coordinate.y)).add(forward.mul(1.5)),
    ).toVar();
    const hit = intersectScene(origin, direction).toVar();
    const color = vec3(0.9).toVar();
    const threshold = resolution.x.mul(split.mul(2).sub(1)).add(0.5).div(resolution.y);
    If(hit.x.lessThan(100), () => {
      const position = origin.add(direction.mul(hit.x)).toVar();
      const normal = hitNormal(position, hit.z).toVar();
      const coordinates = position.mul(scale).toVar();
      const material = vec3(0).toVar();
      If(coordinate.x.lessThan(threshold), () => {
        material.assign(materialAt(coordinates, hit.y));
      }).Else(() => {
        const directionX = normalize(
          right
            .mul(coordinate.x.add(float(2).div(resolution.y)))
            .add(up.mul(coordinate.y))
            .add(forward.mul(1.5)),
        ).toVar();
        const directionY = normalize(
          right
            .mul(coordinate.x)
            .add(up.mul(coordinate.y.add(float(2).div(resolution.y))))
            .add(forward.mul(1.5)),
        ).toVar();
        // Signed epsilon only guards nearly parallel tangent-plane intersections.
        const denominatorX = dot(directionX, normal).toVar();
        const denominatorY = dot(directionY, normal).toVar();
        const safeX = max(abs(denominatorX), 0.000001).mul(denominatorX.lessThan(0).select(-1, 1));
        const safeY = max(abs(denominatorY), 0.000001).mul(denominatorY.lessThan(0).select(-1, 1));
        const planeOffset = dot(origin.sub(position), normal);
        const positionX = origin.sub(directionX.mul(planeOffset.div(safeX)));
        const positionY = origin.sub(directionY.mul(planeOffset.div(safeY)));
        material.assign(
          filteredMaterial(
            coordinates,
            positionX.sub(position).mul(scale),
            positionY.sub(position).mul(scale),
            hit.y,
            int(samples),
            footprint,
          ),
        );
      });
      color.assign(material.mul(lightAt(position, normal, hit.w, direction)));
      color.assign(mix(color, vec3(0.9), float(1).sub(exp(hit.x.mul(hit.x).mul(-0.0002)))));
    });
    // Source display curve; protect negative noise-derived values before pow.
    color.assign(pow(max(color, 0), vec3(0.4545)));
    If(split.greaterThan(0).and(split.lessThan(1)), () => {
      color.mulAssign(smoothstep(0.006, 0.008, abs(coordinate.x.sub(threshold))));
    });
    return sRGBTransferEOTF(clamp(color, 0, 1)) as V3;
  })();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  return {
    material,
    controls: [
      {
        id: 'filtering-speed',
        kind: 'number',
        label: '动画速度',
        description: '推进环绕相机；零值停在原作第 7 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'filtering-scale',
        kind: 'number',
        label: '纹理尺度',
        description: '放大程序坐标，增加单位表面的纹理细节；默认 64 与原作一致。',
        min: 16,
        max: 128,
        step: 8,
        initial: 64,
        uniform: scale,
      },
      {
        id: 'filtering-samples',
        kind: 'number',
        label: '每轴采样上限',
        description: '右侧最多使用上限的平方次材质采样；设为 1 可直接比较单次取样。',
        min: 1,
        max: 10,
        step: 1,
        initial: 10,
        uniform: samples,
      },
      {
        id: 'filtering-footprint',
        kind: 'number',
        label: '过滤范围',
        description: '把相邻射线的纹理坐标差换成采样数量；越大越容易达到采样上限。',
        min: 1,
        max: 8,
        step: 0.5,
        initial: 4,
        uniform: footprint,
      },
      {
        id: 'filtering-split',
        kind: 'number',
        label: '对照分界',
        description: '左侧单次取样，右侧自适应过滤；0 为全过滤，1 为全单次取样。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 0.5,
        uniform: split,
      },
    ],
  };
};
export default createShader;
