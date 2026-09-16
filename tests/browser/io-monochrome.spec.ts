import { expect, test } from '@playwright/test';

for (const backend of ['webgl', 'webgpu']) {
  test('I/O ' + backend + ' 保持黑白、无音频且五个参数可恢复', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    const external: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('request', (r) => {
      if (new URL(r.url()).hostname !== '127.0.0.1') external.push(r.url());
    });
    await page.goto('./shaders/io-monochrome/' + (backend === 'webgl' ? '?renderer=webgl' : ''));
    await expect(page.locator('[data-shader-stage]')).toHaveClass(/is-ready/, { timeout: 60_000 });
    test.skip(
      backend === 'webgpu' &&
        (await page.locator('[data-shader-stage]').getAttribute('data-backend')) !== 'webgpu',
      '环境无 WebGPU；独立本机验收强制验证',
    );
    await expect(page.locator('audio,video')).toHaveCount(0);
    await page.getByRole('button', { name: '暂停动画' }).click();
    await page.getByRole('button', { name: '恢复默认参数' }).click();
    await page.locator('[data-quality]').selectOption('medium');
    await page.addStyleTag({
      content:
        '[data-shader-stage] > :not(canvas) { visibility:hidden!important } [data-shader-canvas] { animation:none!important;opacity:1!important;transition:none!important }',
    });
    const canvas = page.locator('[data-shader-canvas]');
    const inspect = async () => {
      const shot = await canvas.screenshot({ animations: 'disabled' });
      const stats = await page.evaluate(async (png) => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + png;
        await image.decode();
        const c = document.createElement('canvas');
        c.width = image.width;
        c.height = image.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        // Fractional mobile layout rounds screenshots outward into the page background.
        // Exclude three device pixels at the edge; do not relax the grayscale tolerance.
        const pixels = ctx.getImageData(3, 3, c.width - 6, c.height - 6).data;
        let chroma = 0,
          min = 255,
          max = 0,
          total = 0,
          white = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          chroma = Math.max(
            chroma,
            Math.abs(pixels[i] - pixels[i + 1]),
            Math.abs(pixels[i] - pixels[i + 2]),
          );
          min = Math.min(min, pixels[i]);
          max = Math.max(max, pixels[i]);
          total += pixels[i];
          if (pixels[i] > 250) white++;
        }
        return {
          chroma,
          min,
          max,
          mean: total / (pixels.length / 4),
          white: white / (pixels.length / 4),
        };
      }, shot.toString('base64'));
      expect(stats.chroma).toBeLessThanOrEqual(1);
      expect(stats.max - stats.min).toBeGreaterThan(40);
      return { shot, stats };
    };
    const initial = await inspect();
    expect(initial.stats.mean).toBeGreaterThan(5);
    expect(initial.stats.white).toBeLessThan(0.15);
    await testInfo.attach('monochrome-baseline', { body: initial.shot, contentType: 'image/png' });
    const sliders = page.locator('[data-parameter-list] input[type=range]');
    await expect(sliders).toHaveCount(5);
    for (const id of ['io-speed', 'io-count', 'io-glow', 'io-pulse', 'io-depth']) {
      const input = page.locator('#' + id);
      const value = await input.inputValue();
      // Speed=0 is independent of elapsed time; max would also be at t=2.5 after reset.
      if (id === 'io-speed') {
        await page.locator('[data-action=play]').evaluate((e: HTMLButtonElement) => e.click());
        await page.waitForTimeout(250);
        await page.locator('[data-action=play]').evaluate((e: HTMLButtonElement) => e.click());
      }
      await page.locator('[data-quality]').selectOption('medium', { force: true });
      const before = await inspect();
      await input.evaluate((el: HTMLInputElement) => {
        el.value = el.max;
        el.dispatchEvent(new Event('input'));
      });
      await page.locator('[data-quality]').selectOption('medium', { force: true });
      expect((await inspect()).shot.equals(before.shot)).toBe(false);
      await input.evaluate((el: HTMLInputElement, v) => {
        el.value = v;
        el.dispatchEvent(new Event('input'));
      }, value);
      await page.locator('[data-quality]').selectOption('medium', { force: true });
      const restored = await inspect();
      const difference = await page.evaluate(
        async ([a, b]) => {
          const decode = async (data: string) => {
            const image = new Image();
            image.src = 'data:image/png;base64,' + data;
            await image.decode();
            const c = document.createElement('canvas');
            c.width = image.width;
            c.height = image.height;
            const ctx = c.getContext('2d')!;
            ctx.drawImage(image, 0, 0);
            return ctx.getImageData(0, 0, c.width, c.height).data;
          };
          const x = await decode(a),
            y = await decode(b);
          if (x.length !== y.length) throw new Error('Canvas dimensions changed');
          let max = 0,
            total = 0;
          for (let i = 0; i < x.length; i++) {
            const d = Math.abs(x[i] - y[i]);
            max = Math.max(max, d);
            total += d;
          }
          return { max, mean: total / x.length };
        },
        [before.shot.toString('base64'), restored.shot.toString('base64')],
      );
      // Permit only sparse 8-bit quantization, never particle movement or changed brightness.
      expect(difference.max).toBeLessThanOrEqual(1);
      expect(difference.mean).toBeLessThan(0.001);
    }
    await page.locator('#io-pulse').evaluate((el: HTMLInputElement) => {
      el.value = '0';
      el.dispatchEvent(new Event('input'));
    });
    expect((await inspect()).stats.mean).toBeGreaterThan(2);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}
