import { expect, test } from '@playwright/test';

for (const backend of ['webgl', 'webgpu'] as const) {
  test('Menger Sponge ' + backend + ' 几何、五个参数与 MIT 来源', async ({ page }, testInfo) => {
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
    await page.goto('./shaders/menger-sponge/' + (backend === 'webgl' ? '?renderer=webgl' : ''));
    await expect(page.locator('[data-shader-stage]')).toHaveClass(/is-ready/, { timeout: 90_000 });
    const actual = await page.locator('[data-shader-stage]').getAttribute('data-backend');
    if (backend === 'webgl') expect(actual).toBe('webgl2');
    test.skip(backend === 'webgpu' && actual !== 'webgpu', 'CI 无 WebGPU；本机另行强制验证');
    await page.getByRole('button', { name: '阅读赏析' }).click();
    await expect(page.locator('.source-card')).toContainText('Menger Sponge');
    await expect(page.locator('.source-card')).toContainText('iq / Inigo Quilez');
    await expect(
      page.locator('.source-card').getByText('MIT（基于旧镜像中的显式声明）'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: '查看 Shadertoy 原作' })).toHaveAttribute(
      'href',
      'https://www.shadertoy.com/view/4sX3Rn',
    );
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '暂停动画' }).click();
    await page.getByRole('button', { name: '恢复默认参数' }).click();
    await page.locator('[data-quality]').selectOption('medium');
    await expect(page.locator('[data-parameter-list] input[type=range]')).toHaveCount(5);
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
      const data = context.getImageData(0, 0, copy.width, copy.height).data;
      let min = 255,
        max = 0,
        chroma = 0,
        white = 0;
      for (let i = 0; i < data.length; i += 4) {
        const light = (data[i] + data[i + 1] + data[i + 2]) / 3;
        min = Math.min(min, light);
        max = Math.max(max, light);
        chroma = Math.max(chroma, Math.abs(data[i] - data[i + 1]), Math.abs(data[i] - data[i + 2]));
        if (light > 250) white++;
      }
      return { range: max - min, chroma, white: white / (data.length / 4) };
    }, initial.toString('base64'));
    expect(visual.range).toBeGreaterThan(70);
    expect(visual.chroma).toBeGreaterThan(30);
    expect(visual.white).toBeLessThan(0.1);
    await testInfo.attach('menger-default', { body: initial, contentType: 'image/png' });

    for (const [id, changedValue] of [
      ['menger-speed', '2'],
      ['menger-levels', '1'],
      ['menger-morph', '1'],
      ['menger-palette', '2'],
      ['menger-shadow', '8'],
    ]) {
      const input = page.locator('#' + id);
      const original = await input.inputValue();
      if (id === 'menger-speed') {
        await page
          .locator('[data-action=play]')
          .evaluate((button: HTMLButtonElement) => button.click());
        await page.clock.runFor(96);
        await page
          .locator('[data-action=play]')
          .evaluate((button: HTMLButtonElement) => button.click());
      }
      const before = await shot();
      await input.evaluate((input: HTMLInputElement, value) => {
        input.value = value;
        input.dispatchEvent(new Event('input'));
      }, changedValue);
      const changed = await shot();
      expect(changed.equals(before), id + ' alters canvas pixels').toBe(false);
      await input.evaluate((input: HTMLInputElement, value) => {
        input.value = value;
        input.dispatchEvent(new Event('input'));
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
      expect(difference.max, id + ' restore maximum byte error').toBeLessThanOrEqual(2);
      expect(difference.mean, id + ' restore mean byte error').toBeLessThan(0.001);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}
