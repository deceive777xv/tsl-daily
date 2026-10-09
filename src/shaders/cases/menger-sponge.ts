/*
 * Menger Sponge — Inigo Quilez / iq (4sX3Rn).
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
 * https://www.shadertoy.com/view/4sX3Rn
 * Explicit MIT based on the approved historical mirror; see case LICENSE.md.
 */
import * as THREE from 'three/webgpu';
import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  clamp,
  cos,
  cross,
  dot,
  float,
  length,
  max,
  min,
  mix,
  mod,
  normalize,
  pow,
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
type V3 = THREE.Node<'vec3'>;
type V4 = THREE.Node<'vec4'>;

const boxDistance = Fn(([point]: [V3]) => {
  const edge = abs(point).sub(1);
  const largest = max(edge.x, max(edge.y, edge.z));
  return min(largest, length(max(edge, 0)));
}).setLayout({
  name: 'mengerBoxDistance',
  type: 'float',
  inputs: [{ name: 'point', type: 'vec3' }],
});

// settings = (recursive levels, morph bias, source time, palette phase).
// Return (distance, construction-derived occlusion, cut level, unused).
const field = Fn(([position, settings]: [V3, V4]) => {
  const point = position.toVar();
  const distance = boxDistance(point).toVar();
  const sample = vec4(distance, 1, 0, 0).toVar();
  const sourceMorph = smoothstep(-0.2, 0.2, cos(settings.z.mul(0.5)).negate());
  const morph = mix(sourceMorph, 1, settings.y);
  const offset = sin(settings.z.mul(0.01)).mul(1.5);
  const scale = float(1).toVar();
  Loop(4, ({ i }) => {
    If(float(i).greaterThanEqual(settings.x), () => {
      Break();
    });
    const shifted = point.add(offset).toVar();
    // ma * (p + off): the source matrix is column-major, not a row rotation.
    const turned = vec3(
      shifted.x.mul(0.6).sub(shifted.z.mul(0.8)),
      shifted.y,
      shifted.x.mul(0.8).add(shifted.z.mul(0.6)),
    );
    point.assign(mix(point, turned, morph));
    const cell = mod(point.mul(scale), 2).sub(1).toVar();
    scale.mulAssign(3);
    const crossDistance = abs(vec3(1).sub(abs(cell).mul(3)));
    const xy = max(crossDistance.x, crossDistance.y);
    const yz = max(crossDistance.y, crossDistance.z);
    const zx = max(crossDistance.z, crossDistance.x);
    const cut = min(xy, min(yz, zx)).sub(1).div(scale);
    If(cut.greaterThan(distance), () => {
      distance.assign(cut);
      sample.assign(
        vec4(cut, min(sample.y, xy.mul(yz).mul(zx).mul(0.2)), float(i).add(1).div(4), 0),
      );
    });
  });
  return sample;
}).setLayout({
  name: 'mengerField',
  type: 'vec4',
  inputs: [
    { name: 'position', type: 'vec3' },
    { name: 'settings', type: 'vec4' },
  ],
});

const boxInterval = Fn(([origin, direction]: [V3, V3]) => {
  const inverse = vec3(1).div(direction);
  const center = inverse.mul(origin);
  const extent = abs(inverse).mul(1.05);
  const near = center.negate().sub(extent);
  const far = center.negate().add(extent);
  return vec2(max(near.x, max(near.y, near.z)), min(far.x, min(far.y, far.z)));
}).setLayout({
  name: 'mengerBoxInterval',
  type: 'vec2',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
  ],
});

const intersection = Fn(([origin, direction, settings]: [V3, V3, V4]) => {
  const interval = boxInterval(origin, direction);
  const result = vec4(-1).toVar();
  If(interval.y.greaterThanEqual(interval.x), () => {
    const travel = interval.x.toVar();
    Loop(64, () => {
      const sample = field(origin.add(direction.mul(travel)), settings).toVar();
      If(sample.x.lessThan(0.002).or(travel.greaterThan(interval.y)), () => {
        Break();
      });
      // Keep the source's last pre-convergence position/material sample.
      result.assign(vec4(travel, sample.yzw));
      travel.addAssign(sample.x);
    });
    If(travel.greaterThan(interval.y), () => {
      result.assign(vec4(-1));
    });
  });
  return result;
}).setLayout({
  name: 'mengerIntersection',
  type: 'vec4',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'settings', type: 'vec4' },
  ],
});

const normalAt = Fn(([point, settings]: [V3, V4]) =>
  normalize(
    vec3(
      field(point.add(vec3(0.001, 0, 0)), settings).x.sub(
        field(point.sub(vec3(0.001, 0, 0)), settings).x,
      ),
      field(point.add(vec3(0, 0.001, 0)), settings).x.sub(
        field(point.sub(vec3(0, 0.001, 0)), settings).x,
      ),
      field(point.add(vec3(0, 0, 0.001)), settings).x.sub(
        field(point.sub(vec3(0, 0, 0.001)), settings).x,
      ),
    ),
  ),
).setLayout({
  name: 'mengerNormal',
  type: 'vec3',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'settings', type: 'vec4' },
  ],
});

const softShadow = Fn(([origin, direction, settings, sharpness]: [V3, V3, V4, F]) => {
  const maximum = boxInterval(origin, direction).y;
  const shadow = float(1).toVar();
  const travel = float(0.01).toVar();
  Loop(64, () => {
    const distance = field(origin.add(direction.mul(travel)), settings).x.toVar();
    shadow.assign(min(shadow, sharpness.mul(distance).div(travel)));
    If(shadow.lessThan(0.001), () => {
      Break();
    });
    travel.addAssign(clamp(distance, 0.005, 0.1));
    If(travel.greaterThan(maximum), () => {
      Break();
    });
  });
  return clamp(shadow, 0, 1);
}).setLayout({
  name: 'mengerSoftShadow',
  type: 'float',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'settings', type: 'vec4' },
    { name: 'sharpness', type: 'float' },
  ],
});

const renderRay = Fn(([origin, direction, settings, sharpness]: [V3, V3, V4, F]) => {
  const color = mix(
    vec3(0.3, 0.2, 0.1).mul(0.5),
    vec3(0.7, 0.9, 1),
    direction.y.mul(0.5).add(0.5),
  ).toVar();
  const hit = intersection(origin, direction, settings).toVar();
  If(hit.x.greaterThan(0), () => {
    const point = origin.add(direction.mul(hit.x)).toVar();
    const normal = normalAt(point, settings).toVar();
    const palette = cos(vec3(0, 1, 2).add(hit.z.mul(2)).add(settings.w))
      .mul(0.5)
      .add(0.5);
    const occlusion = hit.y;
    const light = normalize(vec3(1, 0.9, 0.3));
    const diffuse = dot(normal, light).toVar();
    const shadow = float(1).toVar();
    If(diffuse.greaterThan(0), () => {
      shadow.assign(softShadow(point, light, settings, sharpness));
    });
    diffuse.assign(max(diffuse, 0));
    const halfVector = normalize(light.sub(direction));
    const fresnel = pow(clamp(float(1).sub(dot(halfVector, light)), 0, 1), 5)
      .mul(0.96)
      .add(0.04);
    const specular = diffuse
      .mul(shadow)
      .mul(pow(clamp(dot(halfVector, normal), 0, 1), 16))
      .mul(fresnel);
    const sky = normal.y.mul(0.5).add(0.5);
    const bounce = max(
      dot(normal, vec3(light.x.negate(), light.y, light.z.negate()))
        .mul(0.6)
        .add(0.4),
      0,
    );
    const lighting = vec3(1.1, 0.85, 0.6)
      .mul(diffuse)
      .mul(shadow)
      .add(vec3(0.1, 0.2, 0.4).mul(sky).mul(0.5).mul(occlusion))
      .add(vec3(1).mul(bounce).mul(0.1).mul(occlusion.mul(0.5).add(0.5)))
      .add(vec3(0.15, 0.17, 0.2).mul(occlusion).mul(0.25));
    color.assign(palette.mul(lighting).add(specular.mul(128)));
  });
  return sqrt(color.mul(1.5).div(color.add(1)));
}).setLayout({
  name: 'mengerRenderRay',
  type: 'vec3',
  inputs: [
    { name: 'origin', type: 'vec3' },
    { name: 'direction', type: 'vec3' },
    { name: 'settings', type: 'vec4' },
    { name: 'sharpness', type: 'float' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    levels = uniform(4),
    morph = uniform(0),
    palettePhase = uniform(0),
    sharpness = uniform(64);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(2);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const origin = vec3(
      sin(time.mul(0.25)).mul(2.5),
      cos(time.mul(0.13)).add(1),
      cos(time.mul(0.25)).mul(2.5),
    )
      .mul(1.1)
      .toVar();
    const forward = normalize(origin.negate());
    const right = normalize(cross(vec3(0, 1, 0), forward));
    const up = cross(forward, right);
    const screen = uv().mul(2).sub(1).mul(resolution.div(resolution.y));
    const direction = normalize(right.mul(screen.x).add(up.mul(screen.y)).add(forward.mul(2.5)));
    const color = renderRay(origin, direction, vec4(levels, morph, time, palettePhase), sharpness);
    // Source display-space sqrt curve -> linear material -> shared sRGB output.
    return sRGBTransferEOTF(clamp(color, 0, 1)) as V3;
  })();
  return {
    material,
    controls: [
      {
        id: 'menger-speed',
        kind: 'number',
        label: '动画速度',
        description: '改变环绕相机与坐标变形的时间倍率；零值停在原作第 2 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'menger-levels',
        kind: 'number',
        label: '分形层数',
        description: '从一层大孔逐步加入四层细孔，观察三倍尺度的递归挖孔。',
        min: 1,
        max: 4,
        step: 1,
        initial: 4,
        uniform: levels,
      },
      {
        id: 'menger-morph',
        kind: 'number',
        label: '变形偏置',
        description: '在原作时间驱动的变形之上偏向完全变形；零值保留原作节奏。',
        min: 0,
        max: 1,
        step: 0.05,
        initial: 0,
        uniform: morph,
      },
      {
        id: 'menger-palette',
        kind: 'number',
        label: '调色相位',
        description: '移动余弦调色板的相位，观察不同挖孔层级如何分色。',
        min: 0,
        max: 6.28,
        step: 0.05,
        initial: 0,
        uniform: palettePhase,
      },
      {
        id: 'menger-shadow',
        kind: 'number',
        label: '阴影锐度',
        description: '调整软阴影距离比的倍率；较小值产生较宽的柔和过渡。',
        min: 8,
        max: 96,
        step: 1,
        initial: 64,
        uniform: sharpness,
      },
    ],
  };
};

export default createShader;
