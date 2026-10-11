import { expect, test } from '@playwright/test';

for (const backend of ['webgl', 'webgpu'] as const) {
  test(
    'Filtering procedurals ' + backend + ' 材质过滤、五个参数与 MIT 来源',
    async ({ page }, testInfo) => {
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
      await page.goto(
        './shaders/filtering-procedurals/' + (backend === 'webgl' ? '?renderer=webgl' : ''),
      );
      await expect(page.locator('[data-shader-stage]')).toHaveClass(/is-ready/, {
        timeout: 90_000,
      });
      const actual = await page.locator('[data-shader-stage]').getAttribute('data-backend');
      if (backend === 'webgl') expect(actual).toBe('webgl2');
      test.skip(backend === 'webgpu' && actual !== 'webgpu', 'CI 无 WebGPU；本机另行强制验证');
      await page.getByRole('button', { name: '阅读赏析' }).click();
      await expect(page.locator('.source-card')).toContainText('Filtering procedurals');
      await expect(page.locator('.source-card')).toContainText('Inigo Quilez');
      await expect(
        page.locator('.source-card').getByText('MIT（基于旧镜像中的显式声明）'),
      ).toBeVisible();
      await expect(page.getByRole('link', { name: '查看 Shadertoy 原作' })).toHaveAttribute(
        'href',
        'https://www.shadertoy.com/view/MdjGR1',
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
      const initial = await shot();
      await testInfo.attach('filtering-default', { body: initial, contentType: 'image/png' });
      for (const [id, changedValue] of [
        ['filtering-speed', '2'],
        ['filtering-scale', '128'],
        ['filtering-samples', '1'],
        ['filtering-footprint', '1'],
        ['filtering-split', '0'],
      ]) {
        const original = await page.locator('#' + id).inputValue();
        if (id === 'filtering-speed') {
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
        expect(difference.max, id + ' restore maximum byte error').toBeLessThanOrEqual(2);
        expect(difference.mean, id + ' restore mean byte error').toBeLessThan(0.001);
      }

      // Full-screen comparison at one frozen camera phase: distant texture variation
      // should decrease with filtering while preserving the visible scene.
      await set('filtering-split', '1');
      const raw = await shot();
      await set('filtering-split', '0');
      const filtered = await shot();
      const comparison = await page.evaluate(
        async ([a, b]) => {
          const inspect = async (base64: string) => {
            const image = new Image();
            image.src = 'data:image/png;base64,' + base64;
            await image.decode();
            const copy = document.createElement('canvas');
            copy.width = image.width;
            copy.height = image.height;
            const context = copy.getContext('2d')!;
            context.drawImage(image, 0, 0);
            const width = Math.floor(copy.width * 0.2),
              height = Math.floor(copy.height * 0.15);
            const data = context.getImageData(
              Math.floor(copy.width * 0.75),
              Math.floor(copy.height * 0.55),
              width,
              height,
            ).data;
            let total = 0,
              energy = 0,
              samples = 0;
            for (let y = 0; y < height; y++)
              for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * 4;
                total += data[offset] + data[offset + 1] + data[offset + 2];
                if (x > 0)
                  for (let channel = 0; channel < 3; channel++) {
                    energy += Math.abs(data[offset + channel] - data[offset - 4 + channel]);
                    samples++;
                  }
              }
            return { mean: total / (width * height * 3), variation: energy / samples };
          };
          return { raw: await inspect(a), filtered: await inspect(b) };
        },
        [raw.toString('base64'), filtered.toString('base64')],
      );
      expect(comparison.raw.mean).toBeGreaterThan(25);
      expect(comparison.filtered.mean).toBeGreaterThan(25);
      expect(comparison.filtered.variation).toBeLessThan(comparison.raw.variation * 0.9);
      await testInfo.attach('texture-variation', {
        body: JSON.stringify(comparison),
        contentType: 'application/json',
      });
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
