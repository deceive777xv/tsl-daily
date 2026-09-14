import { expect, test } from '@playwright/test';

for (const backend of ['webgl', 'webgpu']) {
  test(`Pretty Hip ${backend} 大视口方环边缘保持像素级过渡`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', '固定桌面 DPR=1 的像素宽度回归');
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto(`./shaders/pretty-hip/${backend === 'webgl' ? '?renderer=webgl' : ''}`);
    await expect(page.locator('[data-shader-stage]')).toHaveClass(/is-ready/, { timeout: 60_000 });
    // CI may lack WebGPU; the forced WebGL2 case must always execute.
    test.skip(
      backend === 'webgpu' &&
        (await page.locator('[data-shader-stage]').getAttribute('data-backend')) !== 'webgpu',
      '此浏览器未提供 WebGPU',
    );
    await page.getByRole('button', { name: '暂停动画' }).click();
    await page.getByRole('button', { name: '恢复默认参数' }).click();
    await page.locator('[data-quality]').selectOption('high');
    await page.evaluate(() => {
      for (const [id, value] of [
        ['hip-style', '1'],
        ['hip-grid', '0'],
        ['hip-density', '8'],
      ]) {
        const input = document.getElementById(id) as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input'));
      }
    });
    await page.addStyleTag({
      content: '[data-shader-stage] > :not(canvas) { visibility: hidden !important; }',
    });
    const pixels = await page
      .locator('[data-shader-canvas]')
      .screenshot({ animations: 'disabled' });
    const transition = await page.evaluate(async (png) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + png;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      // Central cyan cell: scan from its center toward the right-hand ring.
      // Green ranges from background 0.2 to ring 0.65 in display RGB.
      const row = Math.floor(canvas.height / 2);
      const start = Math.floor(canvas.width / 2);
      const end = start + Math.floor(canvas.width / (8 * Math.SQRT2));
      const values = [];
      for (let x = start; x < end; x++)
        values.push((data[(row * canvas.width + x) * 4 + 1] / 255 - 0.2) / 0.45);
      const low = values.findIndex((value) => value >= 0.2);
      const high = values.findIndex((value) => value >= 0.8);
      return { low, high, width: high - low, peak: Math.max(...values), canvasWidth: canvas.width };
    }, pixels.toString('base64'));
    await testInfo.attach('edge-measurement', {
      body: JSON.stringify(transition),
      contentType: 'application/json',
    });
    expect(transition.canvasWidth).toBe(2560);
    expect(transition.low).toBeGreaterThan(0);
    expect(transition.high).toBeGreaterThanOrEqual(transition.low);
    expect(transition.peak).toBeGreaterThan(0.9);
    expect(transition.width).toBeLessThanOrEqual(3);
  });
}
