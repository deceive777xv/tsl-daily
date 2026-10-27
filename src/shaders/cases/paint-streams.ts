/*
 * Paint streams — michael0884 / Mykhailo Moroz (WtfyDj).
 * CC BY-NC-SA 3.0, based on the approved historical Shadertoy snapshot.
 * See the case LICENSE.md for attribution, source hashes and adaptations.
 * The original packed representation is replaced by two float attachments;
 * its 16-bit quantization is retained without passing NaNs between backends.
 */
import * as THREE from 'three/webgpu';
import { RendererUtils } from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  abs,
  clamp,
  cos,
  dot,
  exp,
  float,
  int,
  ivec2,
  length,
  max,
  min,
  mix,
  normalize,
  outputStruct,
  pow,
  property,
  round,
  sRGBTransferEOTF,
  screenCoordinate,
  screenUV,
  sin,
  smoothstep,
  sqrt,
  step,
  tanh,
  texture,
  textureLoad,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import type { ShaderFactory } from '../types';

type V2 = THREE.Node<'vec2'>;
type V3 = THREE.Node<'vec3'>;
type V4 = THREE.Node<'vec4'>;

const WARMUP_STEPS = 600;
const STEP_SECONDS = 1 / 60;

function makeTarget(count: number): THREE.RenderTarget {
  return new THREE.RenderTarget(1, 1, {
    count,
    type: THREE.FloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
}

// Preserve the source's quantization, but store ordinary finite floats.
const quantize = Fn(([value]: [V2]) =>
  round(clamp(value.mul(0.5).add(0.5), 0, 1).mul(65534))
    .div(65534)
    .mul(2)
    .sub(1),
);

const boxDistance = Fn(([point, halfSize]: [V2, V2]) => {
  const d = abs(point).sub(halfSize).toVar();
  return length(max(d, 0)).add(min(max(d.x, d.y), 0));
});

const createShader: ShaderFactory = ({ time: clock, resolution }) => {
  const speed = uniform(1);
  const gravity = uniform(1);
  const pressure = uniform(1);
  const diffusion = uniform(1);
  const highlight = uniform(1);
  const grid = uniform(new THREE.Vector2(400, 250));
  const sourceTime = uniform(0);
  const firstStep = uniform(0, 'int');
  const advected = makeTarget(2);
  const simulated = makeTarget(2);
  const density = makeTarget(1);
  const defaultState = makeTarget(2);
  const defaultDensity = makeTarget(1);
  const position = vec2(screenCoordinate.x, grid.y.sub(screenCoordinate.y));

  // Screen/texture coordinates follow Three's top-left convention. The
  // simulation keeps the original GLSL bottom-left coordinates explicitly.
  function read(target: THREE.RenderTarget, attachment: number, point: V2): V4 {
    const cell = ivec2(point);
    const valid = cell.x
      .greaterThanEqual(0)
      .and(cell.y.greaterThanEqual(0))
      .and(cell.x.lessThan(int(grid.x)))
      .and(cell.y.lessThan(int(grid.y)));
    const address = ivec2(cell.x, int(grid.y).sub(cell.y).sub(1));
    return valid.select(
      textureLoad(target.textures[attachment], ivec2(clamp(vec2(address), 0, grid.sub(1)))),
      vec4(0),
    );
  }

  const border = Fn(([point]: [V2]) => {
    const bound = boxDistance(point.sub(grid.mul(0.5)), grid.mul(0.5)).negate();
    const obstacle = boxDistance(point.sub(grid.mul(vec2(0.5, 0.6))), grid.mul(vec2(0.05, 0.01)));
    const drain = boxDistance(
      point.sub(grid.mul(vec2(0.5, 0.7))),
      grid.mul(vec2(1.5, 0.5)),
    ).negate();
    return max(drain, min(bound, obstacle));
  });

  const boundaryNormal = Fn(([point]: [V2]) => {
    const right = border(point.add(vec2(1, 0))).toVar();
    const left = border(point.sub(vec2(1, 0))).toVar();
    const up = border(point.add(vec2(0, 1))).toVar();
    const down = border(point.sub(vec2(0, 1))).toVar();
    const gradient = vec2(right.sub(left), up.sub(down)).toVar();
    return vec3(
      gradient.div(max(length(gradient), 1e-8)),
      right.add(left).add(up).add(down).mul(0.25).add(0.0001),
    );
  });

  function stateMaterial(
    compute: (outState: V4, outMass: V4) => void,
    name: string,
  ): THREE.MeshBasicNodeMaterial {
    const material = new THREE.MeshBasicNodeMaterial();
    material.name = name;
    material.depthTest = material.depthWrite = false;
    material.blending = THREE.NoBlending;
    material.toneMapped = false;
    const outState = property('vec4');
    const outMass = property('vec4');
    material.colorNode = Fn(() => {
      compute(outState, outMass);
      return vec3(0);
    })();
    material.outputNode = outputStruct(outState, outMass);
    return material;
  }

  const advectionMaterial = stateMaterial((outState, outMass) => {
    const center = vec2(0).toVar();
    const velocity = vec2(0).toVar();
    const mass = vec2(0).toVar();
    If(firstStep.equal(1), () => {
      center.assign(position);
      mass.assign(vec2(0.000001));
    }).Else(() => {
      // One multidimensional Loop emits distinct i/j shader variables.
      Loop(
        { start: -2, end: 2, type: 'int', condition: '<=' },
        { start: -2, end: 2, type: 'int', condition: '<=' },
        ({ i, j }) => {
          const neighbor = position.add(vec2(float(i), float(j))).toVar();
          const state = read(simulated, 0, neighbor).toVar();
          const material = read(simulated, 1, neighbor).xy.toVar();
          const moved = neighbor.add(state.xy).add(state.zw.mul(1.5)).toVar();
          const diameter = float(0.9)
            .add(smoothstep(0, 0.1665, material.x).mul(0.21))
            .mul(diffusion)
            .toVar();
          const low = clamp(
            moved.sub(diameter.mul(0.5)),
            position.sub(0.5),
            position.add(0.5),
          ).toVar();
          const high = clamp(
            moved.add(diameter.mul(0.5)),
            position.sub(0.5),
            position.add(0.5),
          ).toVar();
          const overlap = high.sub(low).toVar();
          const deposited = material.x
            .mul(overlap.x)
            .mul(overlap.y)
            .div(diameter.mul(diameter))
            .toVar();
          center.addAssign(low.add(high).mul(0.5).mul(deposited));
          velocity.addAssign(state.zw.mul(deposited));
          mass.addAssign(vec2(deposited, material.y.mul(deposited)));
        },
      );
      If(mass.x.greaterThan(0), () => {
        center.divAssign(mass.x);
        velocity.divAssign(mass.x);
        mass.y.divAssign(mass.x);
      });
    });
    outState.assign(vec4(quantize(clamp(center.sub(position), -0.5, 0.5)), quantize(velocity)));
    outMass.assign(vec4(mass, 0, 0));
  }, 'Paint streams · reintegration');

  const simulationMaterial = stateMaterial((outState, outMass) => {
    const state = read(advected, 0, position).toVar();
    const mass = read(advected, 1, position).xy.toVar();
    const center = position.add(state.xy).toVar();
    const velocity = state.zw.toVar();
    If(mass.x.greaterThan(0), () => {
      const force = vec2(0).toVar();
      Loop(
        { start: -2, end: 2, type: 'int', condition: '<=' },
        { start: -2, end: 2, type: 'int', condition: '<=' },
        ({ i, j }) => {
          const neighbor = position.add(vec2(float(i), float(j))).toVar();
          const nState = read(advected, 0, neighbor).toVar();
          const nMass = read(advected, 1, neighbor).x.toVar();
          const delta = neighbor.add(nState.xy).sub(center).toVar();
          const ownPressure = mass.x.mul(mass.x.div(0.5).sub(1)).mul(0.04).mul(pressure);
          const otherPressure = nMass.mul(nMass.div(0.5).sub(1)).mul(0.04).mul(pressure);
          const averagePressure = nMass.mul(0.5).mul(ownPressure.add(otherPressure));
          force.subAssign(
            delta
              .mul(exp(dot(delta, delta).negate()))
              .mul(averagePressure)
              .mul(0.5),
          );
        },
      );
      force.addAssign(vec2(0, gravity.mul(-0.0004)).mul(mass.x));
      velocity.addAssign(force.mul(1.5).div(max(mass.x, 1e-12)));
      const normal = boundaryNormal(center).toVar();
      const intoWall = step(normal.z, 5).mul(dot(normal.xy.negate(), velocity)).toVar();
      velocity.addAssign(normal.xy.mul(intoWall.add(abs(intoWall))).mul(0.5));
      If(normal.z.lessThan(0), () => {
        velocity.assign(vec2(0));
      });
      velocity.divAssign(max(length(velocity), 1));
    });
    for (const [x, dye, angle, frequency] of [
      [0.8, 1, -Math.PI * 0.75, 0.4],
      [0.2, 0, -Math.PI * 0.25, 0.3],
    ]) {
      If(length(center.sub(grid.mul(vec2(x, 0.9)))).lessThan(10), () => {
        center.assign(position);
        const direction = sourceTime.mul(frequency).sin().mul(0.3).add(angle);
        velocity.assign(vec2(cos(direction), sin(direction)).mul(0.5));
        mass.assign(mix(mass, vec2(0.5, dye), 0.4));
      });
    }
    outState.assign(vec4(quantize(clamp(center.sub(position), -0.5, 0.5)), quantize(velocity)));
    outMass.assign(vec4(mass, 0, 0));
  }, 'Paint streams · pressure and emitters');

  const densityMaterial = new THREE.MeshBasicNodeMaterial();
  densityMaterial.depthTest = densityMaterial.depthWrite = false;
  densityMaterial.blending = THREE.NoBlending;
  densityMaterial.toneMapped = false;
  densityMaterial.fragmentNode = Fn(() => {
    const ownState = read(advected, 0, position).toVar();
    const ownMass = read(advected, 1, position).xy.toVar();
    const rho = vec4(0).toVar();
    Loop(
      { start: -1, end: 1, type: 'int', condition: '<=' },
      { start: -1, end: 1, type: 'int', condition: '<=' },
      ({ i, j }) => {
        const neighbor = position.add(vec2(float(i), float(j))).toVar();
        const nState = read(advected, 0, neighbor).toVar();
        const delta = position.sub(neighbor.add(nState.xy)).div(0.75).toVar();
        // The source weights the CURRENT cell's V/M by neighboring positions.
        rho.addAssign(vec4(ownState.zw, ownMass).mul(exp(dot(delta, delta).negate())));
      },
    );
    return rho;
  })();

  const densityTexture = texture(density.texture);
  function sampleDensity(point: V2): V4 {
    return densityTexture.sample(vec2(point.x.div(grid.x), float(1).sub(point.y.div(grid.y))));
  }
  density.texture.minFilter = density.texture.magFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicNodeMaterial();
  material.depthTest = material.depthWrite = false;
  material.colorNode = Fn(() => {
    const point = vec2(screenUV.x, float(1).sub(screenUV.y)).mul(grid).toVar();
    const rho = sampleDensity(point).toVar();
    const gradient = vec2(
      sampleDensity(point.add(vec2(2, 0))).z.sub(sampleDensity(point.sub(vec2(2, 0))).z),
      sampleDensity(point.add(vec2(0, 2))).z.sub(sampleDensity(point.sub(vec2(0, 2))).z),
    )
      .mul(-0.5)
      .toVar();
    const normal = normalize(gradient.add(0.00001)).mul(pow(length(gradient), 0.2));
    const specular = pow(max(dot(normal, vec2(Math.cos(1.4), Math.sin(1.4))), 0), 3.5).mul(
      highlight,
    );
    const alpha = pow(smoothstep(0, 1, rho.z), 0.1);
    const attenuation = exp(smoothstep(0.5, 3.75, rho.z).mul(-1.7));
    const blend = tanh(rho.w.sub(0.7).mul(3)).mul(0.5).add(0.5);
    const pigment = sqrt(mix(vec3(1, 0.25, 0), vec3(0.01, 0.16, 1), clamp(blend, 0, 1)));
    const paint = pigment.mul(attenuation.mul(1.5).add(specular.mul(5))).toVar();
    const color = sqrt(mix(vec3(9), paint.mul(paint), alpha)).toVar();
    const edge = float(1).sub(smoothstep(2.5, 10, border(point)));
    const display = tanh(sqrt(mix(color.mul(color), vec3(0), edge)));
    return sRGBTransferEOTF(clamp(display, 0, 1)) as V3;
  })();

  const quad = new THREE.QuadMesh(advectionMaterial);
  function copyQuad(source: THREE.RenderTarget): THREE.QuadMesh {
    const copy = new THREE.MeshBasicNodeMaterial();
    copy.depthTest = copy.depthWrite = false;
    copy.blending = THREE.NoBlending;
    copy.toneMapped = false;
    const first = textureLoad(source.textures[0], ivec2(screenCoordinate));
    copy.fragmentNode =
      source.textures.length === 2
        ? outputStruct(first, textureLoad(source.textures[1], ivec2(screenCoordinate)))
        : first;
    return new THREE.QuadMesh(copy);
  }
  const saveState = copyQuad(simulated);
  const saveDensity = copyQuad(density);
  const restoreState = copyQuad(defaultState);
  const restoreDensity = copyQuad(defaultDensity);
  let initialized = false;
  let dirty = true;
  let frame = 0;
  let previousTime = 0;
  let remainder = 0;
  let physicsKey = '';
  let checkpointGrid = '';

  function simulateStep(renderer: THREE.WebGPURenderer): void {
    firstStep.value = frame === 0 ? 1 : 0;
    sourceTime.value = frame * STEP_SECONDS;
    renderer.setRenderTarget(advected);
    quad.material = advectionMaterial;
    quad.render(renderer);
    renderer.setRenderTarget(simulated);
    quad.material = simulationMaterial;
    quad.render(renderer);
    frame++;
  }

  return {
    material,
    reset: () => {
      dirty = true;
    },
    prepareFrame(renderer) {
      const aspect = Math.round((resolution.value.x / resolution.value.y) * 100) / 100;
      const width = Math.max(120, Math.round(aspect >= 1 ? 400 : 400 * aspect));
      const height = Math.max(120, Math.round(aspect >= 1 ? 400 / aspect : 400));
      const key = [width, height, gravity.value, pressure.value, diffusion.value].join(':');
      const layout = width + ':' + height;
      const defaults = gravity.value === 1 && pressure.value === 1 && diffusion.value === 1;
      const now = clock.value;
      const replay = dirty || !initialized || key !== physicsKey || now < previousTime;
      if (!replay && now === previousTime) return;
      const state = RendererUtils.saveRendererState(renderer);
      RendererUtils.resetRendererState(renderer, state);
      try {
        let needsDensity = true;
        if (replay) {
          if (advected.width !== width || advected.height !== height) checkpointGrid = '';
          for (const target of [advected, simulated, density, defaultState, defaultDensity]) {
            target.setSize(width, height);
          }
          grid.value.set(width, height);
          frame = 0;
          remainder = 0;
          if (defaults && checkpointGrid === layout) {
            renderer.setRenderTarget(simulated);
            restoreState.render(renderer);
            renderer.setRenderTarget(density);
            restoreDensity.render(renderer);
            frame = WARMUP_STEPS;
            firstStep.value = 0;
            sourceTime.value = (frame - 1) * STEP_SECONDS;
            needsDensity = false;
          } else {
            for (let i = 0; i < WARMUP_STEPS; i++) simulateStep(renderer);
          }
          dirty = false;
          initialized = true;
          physicsKey = key;
        } else {
          remainder += Math.max(0, now - previousTime) * speed.value;
          const steps = Math.min(12, Math.floor((remainder + 1e-9) / STEP_SECONDS));
          if (steps === 0) {
            previousTime = now;
            return;
          }
          for (let i = 0; i < steps; i++) simulateStep(renderer);
          remainder -= steps * STEP_SECONDS;
        }
        previousTime = now;
        if (needsDensity) {
          renderer.setRenderTarget(density);
          quad.material = densityMaterial;
          quad.render(renderer);
        }
        if (defaults && checkpointGrid !== layout) {
          renderer.setRenderTarget(defaultState);
          saveState.render(renderer);
          renderer.setRenderTarget(defaultDensity);
          saveDensity.render(renderer);
          checkpointGrid = layout;
        }
      } finally {
        RendererUtils.restoreRendererState(renderer, state);
      }
    },
    controls: [
      {
        id: 'paint-speed',
        kind: 'number',
        label: '模拟速度',
        description: '改变固定步长的推进次数；暂停时调节不会移动液流。',
        min: 0,
        max: 2,
        step: 0.1,
        initial: 1,
        uniform: speed,
      },
      {
        id: 'paint-gravity',
        kind: 'number',
        label: '重力强度',
        description: '改变下落加速度；调节后重演前十秒，便于比较。',
        min: 0.5,
        max: 2,
        step: 0.1,
        initial: 1,
        uniform: gravity,
      },
      {
        id: 'paint-pressure',
        kind: 'number',
        label: '压力响应',
        description: '改变局部密度偏离静止密度时的作用力；调节后重演。',
        min: 0.5,
        max: 1.5,
        step: 0.1,
        initial: 1,
        uniform: pressure,
      },
      {
        id: 'paint-diffusion',
        kind: 'number',
        label: '分布宽度',
        description: '改变重积分的矩形分布宽度，观察细滴与平滑流动；调节后重演。',
        min: 0.9,
        max: 1.1,
        step: 0.02,
        initial: 1,
        uniform: diffusion,
      },
      {
        id: 'paint-highlight',
        kind: 'number',
        label: '表面高光',
        description: '只改变密度梯度的高光亮度，不重新计算流体状态。',
        min: 0,
        max: 2,
        step: 0.1,
        initial: 1,
        uniform: highlight,
      },
    ],
  };
};

export default createShader;
