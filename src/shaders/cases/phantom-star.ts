// Phantom Star for CineShader — kasari39 (ttKGDt).
// Phantom Mode — aiekick / Stephane Cuillerdier (MtScWW).
// CC BY-NC-SA 3.0; main work uses historical-mirror default license evidence.
// See the case LICENSE.md for both source archives and the approval scope.
import * as THREE from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  abs,
  atan,
  clamp,
  cos,
  cross,
  exp,
  float,
  floor,
  length,
  max,
  min,
  mod,
  normalize,
  sin,
  sRGBTransferEOTF,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';
type F = THREE.Node<'float'>;
type V2 = THREE.Node<'vec2'>;
type V3 = THREE.Node<'vec3'>;

// Original uses row-vector p * mat2(c,s,-s,c), not mat2 * p.
const rotate = Fn(([p, angle]: [V2, F]) => {
  const c = cos(angle),
    s = sin(angle);
  return vec2(p.x.mul(c).add(p.y.mul(s)), p.y.mul(c).sub(p.x.mul(s)));
}).setLayout({
  name: 'phantomRotate',
  type: 'vec2',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'angle', type: 'float' },
  ],
});

// settings = (time, angular sectors, fold count). Explicit arguments keep
// the distance function shared inside the ray loop on both GPU backends.
const field = Fn(([point, settings]: [V3, V3]) => {
  const p = vec3(
    mod(point.x.sub(5), 10).sub(5),
    mod(point.y.sub(5), 10).sub(5),
    mod(point.z, 16).sub(8),
  ).toVar();
  const sectorAngle = float(Math.PI * 2).div(settings.y);
  const angle = floor(atan(p.x, p.y).add(float(Math.PI).div(settings.y)).div(sectorAngle)).mul(
    sectorAngle,
  );
  p.xy.assign(rotate(p.xy, angle.negate()));
  Loop(6, ({ i }) => {
    If(float(i).lessThan(settings.z), () => {
      p.assign(abs(p).sub(1));
      p.xy.assign(rotate(p.xy, settings.x.mul(0.3)));
      p.xz.assign(rotate(p.xz, settings.x.mul(0.1)));
    });
  });
  p.xz.assign(rotate(p.xz, settings.x));
  const d = abs(p).sub(vec3(0.4, 0.8, 0.3));
  return min(max(d.x, max(d.y, d.z)), 0).add(length(max(d, 0)));
}).setLayout({
  name: 'phantomField',
  type: 'float',
  inputs: [
    { name: 'point', type: 'vec3' },
    { name: 'settings', type: 'vec3' },
  ],
});

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    sectors = uniform(5),
    folds = uniform(5),
    falloff = uniform(3),
    pulse = uniform(2);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(2);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const colorNode = Fn(() => {
    const screen = uv()
      .mul(2)
      .sub(1)
      .mul(resolution.div(min(resolution.x, resolution.y)));
    const origin = vec3(0, 0, time.mul(-3));
    const direction = vec3(0, 0, -1);
    // Keep the original unnormalized up vector; normalizing it would alter the view.
    const up = vec3(sin(time), 1, 0);
    const side = cross(direction, up);
    const ray = normalize(side.mul(screen.x).add(up.mul(screen.y)).add(direction));
    const travel = float(0).toVar(),
      accumulated = float(0).toVar(),
      bands = float(0).toVar();
    const settings = vec3(time, sectors, folds);
    Loop(99, () => {
      const position = origin.add(ray.mul(travel)).toVar();
      // Absolute distance allows traversal through surfaces. The positive lower
      // bound prevents zero steps; this is a glow integral, not first-hit shading.
      const distance = max(abs(field(position, settings)), 0.02).toVar();
      const light = exp(distance.mul(falloff).negate()).toVar();
      If(mod(length(position).add(time.mul(24)), 30).lessThan(3), () => {
        light.mulAssign(pulse);
        bands.addAssign(light);
      });
      accumulated.addAssign(light);
      travel.addAssign(distance.mul(0.5));
    });
    const rgb = vec3(
      accumulated.mul(0.01),
      accumulated.mul(0.011).add(bands.mul(0.002)),
      accumulated.mul(0.012).add(bands.mul(0.005)),
    );
    // Original alpha 1-travel*.03 is CineShader depth metadata, not site opacity.
    // Decode display RGB once before the shared renderer's sRGB output.
    return sRGBTransferEOTF(clamp(rgb, 0, 1)) as V3;
  })();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  return {
    material,
    controls: [
      {
        id: 'phantom-speed',
        kind: 'number',
        label: '流动速度',
        description: '同时改变相机推进、折叠旋转与光带速度；零值停在第 2 秒。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'phantom-sectors',
        kind: 'number',
        label: '旋转分区',
        description: '把 XY 平面折回同一个角扇区，观察三到八重重复。',
        min: 3,
        max: 8,
        step: 1,
        initial: 5,
        uniform: sectors,
      },
      {
        id: 'phantom-folds',
        kind: 'number',
        label: '折叠次数',
        description: '重复绝对值折叠与旋转，改变盒体组成的几何细节。',
        min: 3,
        max: 6,
        step: 1,
        initial: 5,
        uniform: folds,
      },
      {
        id: 'phantom-falloff',
        kind: 'number',
        label: '辉光衰减',
        description: '数值越大，离表面稍远的采样点贡献越少，光晕更收敛。',
        min: 2,
        max: 5,
        step: 0.1,
        initial: 3,
        uniform: falloff,
      },
      {
        id: 'phantom-pulse',
        kind: 'number',
        label: '光带倍率',
        description: '控制径向移动亮带内的贡献；原作为两倍。',
        min: 0,
        max: 3,
        step: 0.1,
        initial: 2,
        uniform: pulse,
      },
    ],
  };
};
export default createShader;
