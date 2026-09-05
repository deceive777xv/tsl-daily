import * as THREE from 'three/webgpu';
import { uniform } from 'three/tsl';

import { dprForMode, nextAutoDpr, type QualityMode } from './quality';
import type { ShaderContext, ShaderFactory, ShaderProgram } from './types';

type ShaderModule = { default: ShaderFactory };

const caseModules = import.meta.glob<ShaderModule>('./cases/*.ts');

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required shader UI element: ${selector}`);
  return element;
}

function updateButtonState(button: HTMLButtonElement, playing: boolean): void {
  button.setAttribute('aria-label', playing ? '暂停动画' : '播放动画');
  const playIcon = button.querySelector<HTMLElement>('[data-icon-play]');
  const pauseIcon = button.querySelector<HTMLElement>('[data-icon-pause]');
  if (playIcon) playIcon.hidden = playing;
  if (pauseIcon) pauseIcon.hidden = !playing;
}

function createControlRows(
  program: ShaderProgram,
  container: HTMLElement,
  renderOnce: () => void,
): () => void {
  const resetters: Array<() => void> = [];

  for (const control of program.controls) {
    const label = document.createElement('label');
    label.className = 'parameter-control';
    label.title = control.description;

    const heading = document.createElement('span');
    heading.className = 'parameter-control__heading';
    const name = document.createElement('span');
    name.textContent = control.label;
    const output = document.createElement('output');
    output.htmlFor = control.id;
    heading.append(name, output);

    if (control.kind === 'number') {
      const input = document.createElement('input');
      input.id = control.id;
      input.type = 'range';
      input.min = String(control.min);
      input.max = String(control.max);
      input.step = String(control.step);
      input.value = String(control.initial);
      output.value = control.initial.toFixed(control.step < 0.1 ? 2 : 1);
      input.addEventListener('input', () => {
        const value = Number(input.value);
        control.uniform.value = value;
        output.value = value.toFixed(control.step < 0.1 ? 2 : 1);
        renderOnce();
      });
      resetters.push(() => {
        input.value = String(control.initial);
        input.dispatchEvent(new Event('input'));
      });
      label.append(heading, input);
    } else {
      const input = document.createElement('input');
      input.id = control.id;
      input.type = 'color';
      input.value = control.initial;
      output.value = control.initial.toUpperCase();
      input.addEventListener('input', () => {
        control.uniform.value.set(input.value);
        output.value = input.value.toUpperCase();
        renderOnce();
      });
      resetters.push(() => {
        input.value = control.initial;
        input.dispatchEvent(new Event('input'));
      });
      label.append(heading, input);
    }

    container.append(label);
  }

  return () => resetters.forEach((reset) => reset());
}

export function bootShaderExperience(root: HTMLElement): void {
  const slug = root.dataset.caseSlug;
  if (!slug) return;

  const stage = requiredElement<HTMLElement>(root, '[data-shader-stage]');
  const canvas = requiredElement<HTMLCanvasElement>(root, '[data-shader-canvas]');
  const poster = requiredElement<HTMLImageElement>(root, '[data-poster]');
  const status = requiredElement<HTMLElement>(root, '[data-shader-status]');
  const badge = requiredElement<HTMLElement>(root, '[data-renderer-badge]');
  const playButton = requiredElement<HTMLButtonElement>(root, '[data-action="play"]');
  const resetButton = requiredElement<HTMLButtonElement>(root, '[data-action="reset"]');
  const qualitySelect = requiredElement<HTMLSelectElement>(root, '[data-quality]');
  const parameterPanel = requiredElement<HTMLDetailsElement>(root, '[data-parameter-panel]');
  const parameterList = requiredElement<HTMLElement>(root, '[data-parameter-list]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');

  let renderer: THREE.WebGPURenderer | undefined;
  let scene: THREE.Scene | undefined;
  let camera: THREE.OrthographicCamera | undefined;
  let program: ShaderProgram | undefined;
  let resetControls: () => void = () => {};
  let initialized = false;
  let initializing: Promise<void> | undefined;
  let playing = !reduceMotion.matches;
  let elapsed = 0;
  let lastFrame = performance.now();
  let averageSamples: number[] = [];
  let autoDpr = Math.min(window.devicePixelRatio || 1, 1.25);
  let qualityMode: QualityMode = 'auto';
  let idleTimer = 0;

  const timeNode = uniform(0);
  const resolutionNode = uniform(new THREE.Vector2(1, 1));
  const pointerNode = uniform(new THREE.Vector2(0.5, 0.5));
  const context = {
    time: timeNode,
    resolution: resolutionNode,
    pointer: pointerNode,
  } as unknown as ShaderContext;

  function announce(message: string): void {
    status.textContent = message;
  }

  function renderOnce(): void {
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function applySize(): void {
    if (!renderer) return;
    const bounds = stage.getBoundingClientRect();
    const dpr = dprForMode(qualityMode, window.devicePixelRatio || 1, autoDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
    const drawingBuffer = renderer.getDrawingBufferSize(new THREE.Vector2());
    resolutionNode.value.copy(drawingBuffer);
    renderOnce();
  }

  function animate(now: number): void {
    const delta = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    elapsed += delta;
    timeNode.value = elapsed;
    renderOnce();

    if (qualityMode !== 'auto') return;
    averageSamples.push(delta * 1000);
    if (averageSamples.length < 60) return;

    const average = averageSamples.reduce((sum, sample) => sum + sample, 0) / averageSamples.length;
    averageSamples = [];
    const target = coarsePointer.matches ? 1000 / 30 : 1000 / 60;
    const maximum = Math.min(window.devicePixelRatio || 1, 1.5);
    const next = nextAutoDpr(autoDpr, average, target, maximum);
    if (next !== autoDpr) {
      autoDpr = next;
      applySize();
    }
  }

  function syncPlayback(): void {
    const shouldAnimate = playing && !document.hidden;
    updateButtonState(playButton, shouldAnimate);
    if (!renderer) return;
    renderer.setAnimationLoop(shouldAnimate ? animate : null);
    if (!shouldAnimate) renderOnce();
  }

  async function initialize(): Promise<void> {
    if (initialized) return;
    if (initializing) return initializing;

    initializing = (async () => {
      try {
        const modulePath = `./cases/${slug}.ts`;
        const loader = caseModules[modulePath];
        if (!loader) throw new Error(`Shader module not found for ${slug}`);
        const module = await loader();
        program = module.default(context);

        const forceWebGL = new URLSearchParams(window.location.search).get('renderer') === 'webgl';
        renderer = new THREE.WebGPURenderer({
          canvas,
          alpha: false,
          antialias: false,
          forceWebGL,
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        await renderer.init();

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        camera.position.z = 1;
        scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), program.material));

        if (program.controls.length > 0) {
          parameterPanel.hidden = false;
          resetControls = createControlRows(program, parameterList, renderOnce);
        }

        const backendInfo = renderer.backend as unknown as { isWebGPUBackend?: boolean };
        const backend = backendInfo.isWebGPUBackend ? 'WebGPU' : 'WebGL2';
        badge.textContent = backend;
        stage.dataset.backend = backend.toLowerCase();
        initialized = true;
        applySize();
        poster.setAttribute('aria-hidden', 'true');
        stage.classList.add('is-ready');
        announce(`实时 Shader 已使用 ${backend} 启动。`);
        syncPlayback();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Unable to start shader experience:', error);
        badge.textContent = '静态模式';
        stage.classList.add('has-error');
        announce(`无法启动实时 Shader。当前显示静态替身。${message}`);
        playing = false;
        updateButtonState(playButton, false);
      }
    })();

    return initializing;
  }

  playButton.addEventListener('click', async () => {
    if (!initialized) await initialize();
    if (!initialized) return;
    playing = !playing;
    lastFrame = performance.now();
    syncPlayback();
    announce(playing ? '动画继续播放。' : '动画已暂停。');
  });

  resetButton.addEventListener('click', () => {
    elapsed = 0;
    timeNode.value = 0;
    pointerNode.value.set(0.5, 0.5);
    resetControls();
    renderOnce();
    announce('已恢复默认参数。');
  });

  qualitySelect.addEventListener('change', () => {
    qualityMode = qualitySelect.value as QualityMode;
    averageSamples = [];
    applySize();
    announce(`画质已切换为${qualitySelect.selectedOptions[0]?.textContent ?? '自动'}。`);
  });

  let dragPointerId: number | undefined;

  function finishPointerDrag(event: PointerEvent): void {
    if (event.pointerId !== dragPointerId) return;
    dragPointerId = undefined;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }

  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== dragPointerId) return;
    if ((event.buttons & 1) === 0) {
      finishPointerDrag(event);
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    pointerNode.value.set(
      THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      THREE.MathUtils.clamp(1 - (event.clientY - bounds.top) / bounds.height, 0, 1),
    );
    renderOnce();
  });

  let swipeStart: [number, number] | undefined;
  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') {
      swipeStart = [event.clientX, event.clientY];
      return;
    }
    if (!event.isPrimary || event.button !== 0) return;
    dragPointerId = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointerup', (event) => {
    finishPointerDrag(event);
    if (!swipeStart || event.pointerType !== 'touch') return;
    const [startX, startY] = swipeStart;
    swipeStart = undefined;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (Math.abs(deltaX) < 80 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
    const selector = deltaX > 0 ? '[aria-label="查看上一个案例"]' : '[aria-label="查看下一个案例"]';
    const destination = root.querySelector<HTMLAnchorElement>(selector)?.href;
    if (destination) window.location.href = destination;
  });
  canvas.addEventListener('pointercancel', finishPointerDrag);
  canvas.addEventListener('lostpointercapture', (event) => {
    if (event.pointerId === dragPointerId) dragPointerId = undefined;
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.matches('input, select, textarea, button, a')) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const selector =
      event.key === 'ArrowLeft' ? '[aria-label="查看上一个案例"]' : '[aria-label="查看下一个案例"]';
    const destination = root.querySelector<HTMLAnchorElement>(selector)?.href;
    if (destination) window.location.href = destination;
  });

  function showChrome(): void {
    root.classList.remove('is-idle');
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (!root.matches(':focus-within') && playing) root.classList.add('is-idle');
    }, 3600);
  }

  root.addEventListener('pointermove', showChrome, { passive: true });
  root.addEventListener('focusin', showChrome);
  document.addEventListener('visibilitychange', syncPlayback);
  new ResizeObserver(applySize).observe(stage);

  updateButtonState(playButton, playing);
  showChrome();
  if (playing) void initialize();
  else {
    badge.textContent = '减少动态效果';
    announce('已按系统偏好暂停动画。选择播放动画可启动实时 Shader。');
  }
}
