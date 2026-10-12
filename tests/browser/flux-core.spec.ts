import { expect, test } from '@playwright/test';

for (const backend of ['webgl', 'webgpu'] as const) {
  test('Flux Core ' + backend + ' 螺旋结构、五个参数与 CC0 来源', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
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
    await page.goto('./shaders/flux-core/' + (backend === 'webgl' ? '?renderer=webgl' : ''));
    await expect(page.locator('[data-shader-stage]')).toHaveClass(/is-ready/, {
      timeout: 90_000,
    });
    const actual = await page.locator('[data-shader-stage]').getAttribute('data-backend');
    if (backend === 'webgl') expect(actual).toBe('webgl2');
    test.skip(backend === 'webgpu' && actual !== 'webgpu', 'CI 无 WebGPU；本机另行强制验证');
    await page.getByRole('button', { name: '阅读赏析' }).click();
    await expect(page.locator('.source-card')).toContainText('Flux Core');
    await expect(page.locator('.source-card')).toContainText('Otavio Good');
    await expect(
      page.locator('.source-card').getByText('CC0 1.0（基于旧镜像中的显式声明）'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: '查看 Shadertoy 原作' })).toHaveAttribute(
      'href',
      'https://www.shadertoy.com/view/ltlSWf',
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
    const set = async (id: string, value: string) =>
      page.locator('#' + id).evaluate((input: HTMLInputElement, value) => {
        input.value = value;
        input.dispatchEvent(new Event('input'));
      }, value);
    const restores: { id: string; max: number; mean: number }[] = [];
    const initial = await shot();
    await testInfo.attach('flux-default', { body: initial, contentType: 'image/png' });
    for (const [id, changedValue] of [
      ['flux-speed', '2'],
      ['flux-structure', '0'],
      ['flux-carving', '0.4'],
      ['flux-glow', '0.4'],
      ['flux-rust', '2'],
    ]) {
      const original = await page.locator('#' + id).inputValue();
      if (id === 'flux-speed') {
        await page
          .locator('[data-action=play]')
          .evaluate((button: HTMLButtonElement) => button.click());
        await page.clock.runFor(96);
        await page
          .locator('[data-action=play]')
          .evaluate((button: HTMLButtonElement) => button.click());
      }
      const before = await shot();
      await set(id, changedValue);
      const changed = await shot();
      expect(changed.equals(before), id + ' changes rendered pixels').toBe(false);
      await set(id, original);
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
      restores.push({ id, ...difference });
      expect(difference.max, id + ' restore maximum byte error').toBeLessThanOrEqual(2);
      expect(difference.mean, id + ' restore mean byte error').toBeLessThan(0.001);
    }

    const appearance = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + base64;
      await image.decode();
      const copy = document.createElement('canvas');
      copy.width = image.width;
      copy.height = image.height;
      const context = copy.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, copy.width, copy.height).data;
      let sum = 0,
        squares = 0,
        black = 0,
        white = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const mean = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        sum += mean;
        squares += mean * mean;
        if (mean < 2) black++;
        if (mean > 253) white++;
      }
      const count = pixels.length / 4,
        mean = sum / count;
      return {
        mean,
        variance: squares / count - mean * mean,
        blackFraction: black / count,
        whiteFraction: white / count,
      };
    }, initial.toString('base64'));
    expect(appearance.mean).toBeGreaterThan(25);
    expect(appearance.mean).toBeLessThan(225);
    expect(appearance.variance).toBeGreaterThan(100);
    expect(appearance.blackFraction).toBeLessThan(0.5);
    expect(appearance.whiteFraction).toBeLessThan(0.25);
    await testInfo.attach('flux-appearance-controls', {
      body: JSON.stringify({ appearance, restores }),
      contentType: 'application/json',
    });

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}
