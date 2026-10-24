import { expect, test } from '@playwright/test';

for (const backend of ['webgl', 'webgpu'] as const) {
  test(
    'M-O (from Wall-E) ' + backend + ' 清扫机器人、五个参数与来源',
    async ({ page }, testInfo) => {
      // CI software WebGL renders four AA samples per pixel, including every
      // clock step and parameter restore. Keep the same image checks and allow
      // these frames to finish on slower runners.
      test.setTimeout(process.env.CI ? 180_000 : 120_000);
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
      await page.goto('./shaders/mo-cleaner/' + (backend === 'webgl' ? '?renderer=webgl' : ''));
      await expect(page.locator('[data-shader-stage]')).toHaveClass(/is-ready/, {
        timeout: 90_000,
      });
      const actual = await page.locator('[data-shader-stage]').getAttribute('data-backend');
      if (backend === 'webgl') expect(actual).toBe('webgl2');
      test.skip(backend === 'webgpu' && actual !== 'webgpu', 'CI 无 WebGPU；本机另行强制验证');
      await page.getByRole('button', { name: '阅读赏析' }).click();
      const source = page.locator('.source-card');
      await expect(source).toContainText('M-O (from Wall-E)');
      await expect(source).toContainText('dean_the_coder');
      await expect(source.getByText('CC BY-NC-SA 3.0（基于旧镜像中的显式声明）')).toBeVisible();
      await expect(page.getByRole('link', { name: '查看 Shadertoy 原作' })).toHaveAttribute(
        'href',
        'https://www.shadertoy.com/view/WdVfRc',
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
      // Capture CSS pixels consistently at medium quality on both viewports.
      const shot = () => canvas.screenshot({ animations: 'disabled', scale: 'css' });
      const initial = await shot();
      const appearance = await page.evaluate(async (base64) => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + base64;
        await image.decode();
        const copy = document.createElement('canvas');
        copy.width = image.width;
        copy.height = image.height;
        const context = copy.getContext('2d')!;
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(3, 3, copy.width - 6, copy.height - 6).data;
        let low = 255,
          high = 0,
          redLight = 0,
          black = 0,
          white = 0;
        const sums = [0, 0, 0];
        for (let i = 0; i < pixels.length; i += 4) {
          const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
          const brightness = (r + g + b) / 3;
          low = Math.min(low, brightness);
          high = Math.max(high, brightness);
          if (r > g + 30 && r > b + 30) redLight++;
          if (r === 0 && g === 0 && b === 0) black++;
          if (r === 255 && g === 255 && b === 255) white++;
          sums[0] += r;
          sums[1] += g;
          sums[2] += b;
        }
        const count = pixels.length / 4;
        return {
          width: copy.width,
          height: copy.height,
          brightnessRange: high - low,
          redLightFraction: redLight / count,
          blackFraction: black / count,
          whiteFraction: white / count,
          meanRGB: sums.map((value) => value / count),
        };
      }, initial.toString('base64'));
      expect(appearance.brightnessRange).toBeGreaterThan(100);
      expect(appearance.redLightFraction).toBeGreaterThan(0.0005);
      expect(appearance.blackFraction).toBeLessThan(0.9);
      expect(appearance.whiteFraction).toBeLessThan(0.1);
      expect(appearance.meanRGB[1]).toBeGreaterThan(30);
      expect(appearance.meanRGB[1]).toBeLessThan(220);
      const restores: { id: string; max: number; mean: number }[] = [];
      for (const [id, changedValue] of [
        ['mo-speed', '2'],
        ['mo-pose', '0'],
        ['mo-shadow', '0'],
        ['mo-reflection', '0.1'],
        ['mo-framing', '1.3'],
      ]) {
        const input = page.locator('#' + id);
        const original = await input.inputValue();
        if (id === 'mo-speed') {
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
        expect((await shot()).equals(before), id + ' changes the canvas').toBe(false);
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
        restores.push({ id, ...difference });
      }
      await testInfo.attach('mo-appearance-controls', {
        body: JSON.stringify({ appearance, restores }),
        contentType: 'application/json',
      });
      await testInfo.attach('mo-default', { body: initial, contentType: 'image/png' });
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
