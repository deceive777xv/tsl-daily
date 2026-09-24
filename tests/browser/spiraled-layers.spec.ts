import { expect, test } from '@playwright/test';

for (const backend of ['webgl', 'webgpu'] as const) {
  test('Spiraled Layers ' + backend + ' 画面、四个参数与素材来源', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    const external: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('request', (request) => {
      if (new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());
    });
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'));
    await page.goto('./shaders/spiraled-layers/' + (backend === 'webgl' ? '?renderer=webgl' : ''));
    await expect(page.locator('[data-shader-stage]')).toHaveClass(/is-ready/, { timeout: 90_000 });
    const actual = await page.locator('[data-shader-stage]').getAttribute('data-backend');
    if (backend === 'webgl') expect(actual).toBe('webgl2');
    test.skip(backend === 'webgpu' && actual !== 'webgpu', 'CI 无 WebGPU；本机另行强制验证');
    await expect(page.locator('audio,video')).toHaveCount(0);
    await page.getByRole('button', { name: '阅读赏析' }).click();
    await expect(page.locator('.source-card')).toContainText('Spiraled Layers');
    await expect(page.locator('.source-card')).toContainText('Tater');
    await expect(
      page.locator('.source-card').getByText('CC BY-NC-SA 3.0（基于旧镜像快照）'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: '查看 Shadertoy 原作' })).toHaveAttribute(
      'href',
      'https://www.shadertoy.com/view/Ns3XWf',
    );
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '暂停动画' }).click();
    await page.getByRole('button', { name: '恢复默认参数' }).click();
    await page.locator('[data-quality]').selectOption('medium');
    await page.addStyleTag({
      content:
        '[data-shader-stage] > :not(canvas) { visibility:hidden!important } [data-shader-canvas] { animation:none!important;opacity:1!important;transition:none!important }',
    });
    const canvas = page.locator('[data-shader-canvas]');
    const shot = () => canvas.screenshot({ animations: 'disabled' });
    const initial = await shot();
    const visual = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + base64;
      await image.decode();
      const copy = document.createElement('canvas');
      copy.width = image.width;
      copy.height = image.height;
      const context = copy.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const data = context.getImageData(3, 3, copy.width - 6, copy.height - 6).data;
      let min = 255,
        max = 0,
        saturated = 0,
        chroma = 0;
      for (let i = 0; i < data.length; i += 4) {
        min = Math.min(min, data[i], data[i + 1], data[i + 2]);
        max = Math.max(max, data[i], data[i + 1], data[i + 2]);
        chroma = Math.max(chroma, Math.abs(data[i] - data[i + 1]), Math.abs(data[i] - data[i + 2]));
        if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) saturated++;
      }
      return { min, max, chroma, saturated: saturated / (data.length / 4) };
    }, initial.toString('base64'));
    expect(visual.max - visual.min).toBeGreaterThan(50);
    expect(visual.chroma).toBeGreaterThan(30);
    expect(visual.saturated).toBeLessThan(0.35);
    await testInfo.attach('spiraled-layers-baseline', { body: initial, contentType: 'image/png' });
    const sliders = page.locator('[data-parameter-list] input[type=range]');
    await expect(sliders).toHaveCount(4);
    for (const id of ['spiral-speed', 'spiral-size', 'spiral-width', 'spiral-yaw']) {
      const input = page.locator('#' + id);
      const original = await input.inputValue();
      if (id === 'spiral-speed') {
        await page
          .locator('[data-action=play]')
          .evaluate((button: HTMLButtonElement) => button.click());
        await page.clock.runFor(96);
        await page
          .locator('[data-action=play]')
          .evaluate((button: HTMLButtonElement) => button.click());
      }
      const before = await shot();
      await input.evaluate((element: HTMLInputElement) => {
        element.value = element.max;
        element.dispatchEvent(new Event('input'));
      });
      const changed = await shot();
      expect(changed.equals(before), id + ' should alter rendered pixels').toBe(false);
      await input.evaluate((element: HTMLInputElement, value) => {
        element.value = value;
        element.dispatchEvent(new Event('input'));
      }, original);
      const restored = await shot();
      const difference = await page.evaluate(
        async ([a, b]) => {
          const decode = async (base64: string) => {
            const image = new Image();
            image.src = 'data:image/png;base64,' + base64;
            await image.decode();
            const copy = document.createElement('canvas');
            copy.width = image.width;
            copy.height = image.height;
            const context = copy.getContext('2d')!;
            context.drawImage(image, 0, 0);
            return context.getImageData(0, 0, copy.width, copy.height).data;
          };
          const first = await decode(a),
            second = await decode(b);
          if (first.length !== second.length) throw new Error('Canvas dimensions changed');
          let max = 0,
            total = 0;
          for (let i = 0; i < first.length; i++) {
            const delta = Math.abs(first[i] - second[i]);
            max = Math.max(max, delta);
            total += delta;
          }
          return { max, mean: total / first.length };
        },
        [before.toString('base64'), restored.toString('base64')],
      );
      expect(difference.max, id + ' restore max error').toBeLessThanOrEqual(2);
      expect(difference.mean, id + ' restore mean error').toBeLessThan(0.001);
    }
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}
