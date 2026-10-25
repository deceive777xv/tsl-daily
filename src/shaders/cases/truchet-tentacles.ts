/*
 * Truchet Tentacles — WAHa_06x36 (ldfGWn).
 * CC BY-NC-SA 3.0 based on the approved historical Shadertoy snapshot;
 * this TSL adaptation follows the same license. See the case LICENSE.md.
 * The environment is generated here; the original cubemap is never fetched.
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
  cubeTexture,
  dot,
  float,
  floor,
  fract,
  length,
  mat3,
  max,
  min,
  normalize,
  pow,
  reflect,
  sin,
  sRGBTransferEOTF,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type V2 = THREE.Node<'vec2'>;
type V3 = THREE.Node<'vec3'>;
const fieldInputs = [
  { name: 'point', type: 'vec3' },
  { name: 'shape', type: 'vec2' },
];

// The six faces contain only a new direction-based sky and a broad light lobe.
// Rows and face directions match the raw WebGL screening's generated input.
function createEnvironment(): THREE.CubeTexture {
  const size = 128;
  const faces = Array.from({ length: 6 }, (_, face) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d')!;
    const image = context.createImageData(size, size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const u = (2 * (x + 0.5)) / size - 1,
          v = (2 * (y + 0.5)) / size - 1;
        const direction = [
          [1, -v, -u],
          [-1, -v, u],
          [u, 1, v],
          [u, -1, -v],
          [u, -v, 1],
          [-u, -v, -1],
        ][face];
        const magnitude = Math.hypot(...direction);
        const [dx, dy, dz] = direction.map((value) => value / magnitude);
        const sky = Math.max(0, dy);
        const panel = Math.pow(Math.max(0, dx * 0.42 + dy * 0.81 + dz * 0.41), 48);
        const color = [
          0.14 + 0.34 * sky + 0.5 * panel,
          0.18 + 0.38 * sky + 0.46 * panel,
          0.24 + 0.42 * sky + 0.4 * panel,
        ];
        const offset = 4 * (y * size + x);
        for (let channel = 0; channel < 3; channel++)
          image.data[offset + channel] = Math.round(255 * Math.min(1, color[channel]));
        image.data[offset + 3] = 255;
      }
    context.putImageData(image, 0, 0);
    return canvas;
  });
  const environment = new THREE.CubeTexture(faces);
  environment.colorSpace = THREE.NoColorSpace;
  environment.magFilter = environment.minFilter = THREE.LinearFilter;
  environment.generateMipmaps = false;
  environment.needsUpdate = true;
  return environment;
}

// shape.x is tube thickness; shape.y is the Lp cross-section exponent.
const arc = Fn(([point, shape]: [V3, V2]) => {
  const q = abs(vec2(length(point.xy).sub(0.5), point.z.sub(0.5))).toVar();
  return pow(pow(q.x, shape.y).add(pow(q.y, shape.y)), float(1).div(shape.y)).sub(shape.x);
}).setLayout({ name: 'truchetArc', type: 'float', inputs: fieldInputs });

const cell = Fn(([point, shape]: [V3, V2]) =>
  min(
    min(arc(point, shape), arc(vec3(point.z, float(1).sub(point.x), point.y), shape)),
    arc(vec3(float(1).sub(point.y), float(1).sub(point.z), point.x), shape),
  ),
).setLayout({ name: 'truchetCell', type: 'float', inputs: fieldInputs });

const field = Fn(([point, shape]: [V3, V2]) => {
  const local = fract(point).toVar(),
    grid = floor(point).toVar();
  const random = fract(
    sin(dot(grid.xy, vec2(sin(grid.z).mul(1.38984), cos(grid.z).mul(1.13233)))).mul(653758.5453),
  ).toVar();
  const oriented = local.toVar();
  If(random.lessThan(1 / 8), () => {
    oriented.assign(local);
  })
    .ElseIf(random.lessThan(2 / 8), () => {
      oriented.assign(vec3(local.x, float(1).sub(local.y), local.z));
    })
    .ElseIf(random.lessThan(3 / 8), () => {
      oriented.assign(vec3(float(1).sub(local.x), local.y, local.z));
    })
    .ElseIf(random.lessThan(4 / 8), () => {
      oriented.assign(vec3(float(1).sub(local.x), float(1).sub(local.y), local.z));
    })
    .ElseIf(random.lessThan(5 / 8), () => {
      oriented.assign(vec3(local.y, local.x, float(1).sub(local.z)));
    })
    .ElseIf(random.lessThan(6 / 8), () => {
      oriented.assign(vec3(local.y, float(1).sub(local.x), float(1).sub(local.z)));
    })
    .ElseIf(random.lessThan(7 / 8), () => {
      oriented.assign(vec3(float(1).sub(local.y), local.x, float(1).sub(local.z)));
    })
    .Else(() => {
      oriented.assign(vec3(float(1).sub(local.y), float(1).sub(local.x), float(1).sub(local.z)));
    });
  return cell(oriented, shape);
}).setLayout({ name: 'truchetField', type: 'float', inputs: fieldInputs });

const createShader: ShaderFactory = (context) => {
  const speed = uniform(1),
    thickness = uniform(0.1),
    section = uniform(8);
  const reflection = uniform(0.1),
    framing = uniform(2);
  const time = float(context.time as unknown as number)
    .mul(speed)
    .add(2);
  const resolution = vec2(context.resolution as unknown as THREE.Vector2);
  const environment = createEnvironment();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const shape = vec2(thickness, section).toVar();
    const screen = uv().mul(2).sub(1).mul(resolution).div(length(resolution)).toVar();
    const t = time.div(3).toVar(),
      s = sin(t).toVar(),
      c = cos(t).toVar();
    // GLSL's column-major matrix is squared twice: m -> m² -> m⁴.
    const camera = mat3(0, 1, 0, s.negate(), 0, c, c, 0, s).toVar();
    camera.assign(camera.mul(camera));
    camera.assign(camera.mul(camera));
    const ray = camera
      .mul(normalize(vec3(screen.mul(framing), dot(screen, screen).sub(1))))
      .toVar();
    const position = vec3(
      sin(t.add(sin(t.mul(2)).div(2)))
        .div(2)
        .add(0.5)
        .mul(2),
      sin(t.sub(sin(t.mul(2)).div(2)).sub(3.141592 / 2))
        .div(2)
        .add(0.5)
        .mul(2),
      t
        .sub(sin(t.mul(4)).div(4))
        .mul(-2 / 3.141592)
        .add(1)
        .mul(2),
    ).toVar();
    const hitIteration = float(64).toVar();
    Loop(64, ({ i }) => {
      const distance = field(position, shape).toVar();
      // The original moves before checking the just-sampled distance.
      position.addAssign(ray.mul(distance));
      If(abs(distance).lessThan(0.001), () => {
        hitIteration.assign(float(i));
        Break();
      });
    });
    const epsilon = 0.0001,
      middle = field(position, shape).toVar();
    const gradient = vec3(
      field(position.add(vec3(epsilon, 0, 0)), shape).sub(middle),
      field(position.add(vec3(0, epsilon, 0)), shape).sub(middle),
      field(position.add(vec3(0, 0, epsilon)), shape).sub(middle),
    ).toVar();
    const normal = gradient.div(max(length(gradient), 0.00000001)).toVar();
    const facing = pow(max(0, dot(normal, ray.negate())), 2).toVar();
    const light = float(1).sub(hitIteration.div(64)).mul(facing).mul(1.4).toVar();
    const color = cos(position.div(2)).add(2).div(3).toVar();
    const reflected = reflect(ray, normal).toVar();
    const warped = reflected.mul(reflected).mul(reflected).toVar();
    // CubeTextureNode flips X for uploaded cube images on both backends.
    // Compensate here to match the raw GL samplerCube reference's direction.
    const environmentColor = cubeTexture(environment, vec3(warped.x.negate(), warped.yz)).rgb;
    const vignette = pow(max(float(1).sub(length(screen)), 0), 0.3);
    const display = color.mul(light).add(environmentColor.mul(reflection)).mul(vignette);
    return sRGBTransferEOTF(clamp(display, 0, 1)) as THREE.Node<'vec3'>;
  })();
  material.addEventListener('dispose', () => environment.dispose());
  return {
    material,
    controls: [
      {
        id: 'truchet-speed',
        kind: 'number',
        label: '穿行速度',
        description: '缩放原作相机时间；零值回到第 2 秒，便于观察结构。',
        min: 0,
        max: 2,
        step: 0.05,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'truchet-thickness',
        kind: 'number',
        label: '管道半厚',
        description: '在每个单位格子内改变弯管厚度，保持端点的位置。',
        min: 0.05,
        max: 0.18,
        step: 0.01,
        initial: 0.1,
        uniform: thickness,
      },
      {
        id: 'truchet-section',
        kind: 'number',
        label: '截面方度',
        description: '2 接近圆形截面，较大指数让四边变平、转角收紧。',
        min: 2,
        max: 12,
        step: 1,
        initial: 8,
        uniform: section,
      },
      {
        id: 'truchet-framing',
        kind: 'number',
        label: '取景宽度',
        description: '改变射线的屏幕分量；默认保留原作的广角投影。',
        min: 1.4,
        max: 2.6,
        step: 0.05,
        initial: 2,
        uniform: framing,
      },
      {
        id: 'truchet-reflection',
        kind: 'number',
        label: '环境反射',
        description: '控制本地生成环境的附加亮度，不改变管道几何。',
        min: 0,
        max: 0.3,
        step: 0.01,
        initial: 0.1,
        uniform: reflection,
      },
    ],
  };
};
export default createShader;
