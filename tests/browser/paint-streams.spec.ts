import { expect, test } from '@playwright/test';

for (const backend of ['webgl', 'webgpu'] as const) {
  test(
    'Paint streams ' + backend + ' 反馈液流、暂停、参数重演与重置',
    async ({ page }, testInfo) => {
      // CI desktop took 5.6 minutes for the initial solve and three 600-step replays.
      test.setTimeout(process.env.CI ? 480_000 : 180_000);
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
      await page.goto('./shaders/paint-streams/' + (backend === 'webgl' ? '?renderer=webgl' : ''));
      await expect(page.locator('[data-shader-stage]')).toHaveClass(/is-ready/, {
        timeout: process.env.CI ? 180_000 : 90_000,
      });
      const actual = await page.locator('[data-shader-stage]').getAttribute('data-backend');
      if (backend === 'webgl') expect(actual).toBe('webgl2');
      test.skip(backend === 'webgpu' && actual !== 'webgpu', 'CI 无 WebGPU；本机另行强制验证');
      await page.getByRole('button', { name: '阅读赏析' }).click();
      const source = page.locator('.source-card');
      await expect(source).toContainText('Paint streams');
      await expect(source).toContainText('michael0884');
      await expect(source.getByText('CC BY-NC-SA 3.0（基于旧镜像快照）')).toBeVisible();
      await expect(page.getByRole('link', { name: '查看 Shadertoy 原作' })).toHaveAttribute(
        'href',
        'https://www.shadertoy.com/view/WtfyDj',
      );
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: '暂停动画' }).click();
      await page.getByRole('button', { name: '恢复默认参数' }).click();
      await page.locator('[data-quality]').selectOption('medium');
      await expect(page.locator('[data-parameter-list] input[type=range]')).toHaveCount(5);
      await page.addStyleTag({
        content:
          '[data-shader-stage] > :not(canvas){visibility:hidden!important}[data-shader-canvas]{animation:none!important;opacity:1!important;transition:none!important}',
      });
      const shot = () =>
        page.locator('[data-shader-canvas]').screenshot({ animations: 'disabled', scale: 'css' });
      // The screenshot style hides stage controls; dispatch the real reset handler.
      const restoreDefaults = () =>
        page.locator('[data-action=reset]').evaluate((button: HTMLButtonElement) => button.click());
      const initial = await shot();
      const difference = async (a: Buffer, b: Buffer) =>
        page.evaluate(
          async ([first, second]) => {
            const decode = async (base64: string) => {
              const image = new Image();
              image.src = 'data:image/png;base64,' + base64;
              await image.decode();
              const canvas = document.createElement('canvas');
              canvas.width = image.width;
              canvas.height = image.height;
              const context = canvas.getContext('2d')!;
              context.drawImage(image, 0, 0);
              return context.getImageData(0, 0, canvas.width, canvas.height).data;
            };
            const x = await decode(first),
              y = await decode(second);
            if (x.length !== y.length) throw Error('Canvas dimensions changed');
            let maximum = 0,
              total = 0;
            for (let i = 0; i < x.length; i++) {
              const delta = Math.abs(x[i] - y[i]);
              maximum = Math.max(maximum, delta);
              total += delta;
            }
            return { max: maximum, mean: total / x.length };
          },
          [a.toString('base64'), b.toString('base64')],
        );
      const appearance = await page.evaluate(async (base64) => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + base64;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(3, 3, canvas.width - 6, canvas.height - 6).data;
        let low = 255,
          high = 0,
          colorful = 0,
          black = 0,
          white = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i],
            g = pixels[i + 1],
            b = pixels[i + 2];
          const l = (r + g + b) / 3;
          low = Math.min(low, l);
          high = Math.max(high, l);
          if (Math.max(r, g, b) - Math.min(r, g, b) > 30) colorful++;
          if (r === 0 && g === 0 && b === 0) black++;
          if (r === 255 && g === 255 && b === 255) white++;
        }
        const n = pixels.length / 4;
        return {
          width: canvas.width,
          height: canvas.height,
          brightnessRange: high - low,
          colorfulFraction: colorful / n,
          blackFraction: black / n,
          whiteFraction: white / n,
        };
      }, initial.toString('base64'));
      expect(appearance.brightnessRange).toBeGreaterThan(100);
      expect(appearance.colorfulFraction).toBeGreaterThan(0.02);
      expect(appearance.blackFraction).toBeLessThan(0.1);
      expect(appearance.whiteFraction).toBeLessThan(0.1);
      await page.clock.runFor(96);
      expect(await difference(initial, await shot()), 'paused simulation remains still').toEqual({
        max: 0,
        mean: 0,
      });

      const restores: { id: string; max: number; mean: number }[] = [];
      for (const [id, value] of [
        ['paint-gravity', '1.8'],
        ['paint-pressure', '0.5'],
        ['paint-diffusion', '1.1'],
        ['paint-highlight', '0'],
      ]) {
        await restoreDefaults();
        const before = await shot();
        const input = page.locator('#' + id);
        const original = await input.inputValue();
        await input.evaluate((element: HTMLInputElement, value) => {
          element.value = value;
          element.dispatchEvent(new Event('input'));
        }, value);
        expect(
          (await difference(before, await shot())).mean,
          id + ' changes output',
        ).toBeGreaterThan(0.001);
        await input.evaluate((element: HTMLInputElement, value) => {
          element.value = value;
          element.dispatchEvent(new Event('input'));
        }, original);
        const restored = await difference(before, await shot());
        expect(restored.max, id + ' deterministic replay max').toBeLessThanOrEqual(2);
        expect(restored.mean, id + ' deterministic replay mean').toBeLessThan(0.001);
        restores.push({ id, ...restored });
      }
      await restoreDefaults();
      const baseline = await shot();
      const setSpeed = async (value: string) =>
        page.locator('#paint-speed').evaluate((input: HTMLInputElement, value) => {
          input.value = value;
          input.dispatchEvent(new Event('input'));
        }, value);
      await setSpeed('0');
      await page
        .locator('[data-action=play]')
        .evaluate((button: HTMLButtonElement) => button.click());
      await page.clock.runFor(96);
      await page
        .locator('[data-action=play]')
        .evaluate((button: HTMLButtonElement) => button.click());
      expect(await difference(baseline, await shot()), 'zero speed retains feedback state').toEqual(
        { max: 0, mean: 0 },
      );
      await setSpeed('2');
      expect(
        await difference(baseline, await shot()),
        'paused speed changes do not advance',
      ).toEqual({ max: 0, mean: 0 });
      await page
        .locator('[data-action=play]')
        .evaluate((button: HTMLButtonElement) => button.click());
      await page.clock.runFor(160);
      await page
        .locator('[data-action=play]')
        .evaluate((button: HTMLButtonElement) => button.click());
      expect(
        (await difference(baseline, await shot())).mean,
        'playback advances feedback',
      ).toBeGreaterThan(0.001);
      await restoreDefaults();
      const reset = await difference(initial, await shot());
      expect(reset.max, 'reset rebuilds state').toBeLessThanOrEqual(2);
      expect(reset.mean, 'reset rebuilds state').toBeLessThan(0.001);
      restores.push({ id: 'paint-speed', ...reset });
      const advanceFromCheckpoint = async () => {
        await page
          .locator('[data-action=play]')
          .evaluate((button: HTMLButtonElement) => button.click());
        await page.clock.runFor(160);
        await page
          .locator('[data-action=play]')
          .evaluate((button: HTMLButtonElement) => button.click());
        return shot();
      };
      const continued = await advanceFromCheckpoint();
      await restoreDefaults();
      const continuation = await difference(continued, await advanceFromCheckpoint());
      expect(continuation.max, 'restored state continues deterministically').toBeLessThanOrEqual(2);
      expect(continuation.mean, 'restored state continues deterministically').toBeLessThan(0.001);
      await restoreDefaults();
      await testInfo.attach('paint-appearance-replay', {
        body: JSON.stringify({ appearance, restores, reset, continuation }),
        contentType: 'application/json',
      });
      await testInfo.attach('paint-default', { body: initial, contentType: 'image/png' });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
      expect(external).toEqual([]);
    },
  );
}
