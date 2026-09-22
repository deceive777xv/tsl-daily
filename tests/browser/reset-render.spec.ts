import { expect, test } from '@playwright/test';

test('恢复默认参数只绘制最终状态，且恢复输入、输出与画面', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'));
  await page.goto('./shaders/lens-flare-example/?renderer=webgl');
  await expect(page.locator('[data-shader-stage]')).toHaveClass(/is-ready/, { timeout: 60_000 });
  await page.getByRole('button', { name: '暂停动画' }).click();
  await page.locator('[data-quality]').selectOption('medium');
  await page.addStyleTag({
    content:
      '[data-shader-stage] > :not(canvas) { visibility:hidden!important } [data-shader-canvas] { animation:none!important;opacity:1!important;transition:none!important }',
  });
  const canvas = page.locator('[data-shader-canvas]');
  const before = await canvas.screenshot({ animations: 'disabled' });
  const values = () =>
    page.locator('[data-parameter-list]').evaluate((panel) => ({
      inputs: Array.from(panel.querySelectorAll('input'), (input) => input.value),
      outputs: Array.from(panel.querySelectorAll('output'), (output) => output.value),
    }));
  const initial = await values();
  await page.locator('[data-parameter-list] input').evaluateAll((inputs) => {
    for (const input of inputs as HTMLInputElement[]) {
      input.value = input.max;
      input.dispatchEvent(new Event('input'));
    }
  });
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  // Count real WebGL draws at the reset interaction, not mocked render callbacks.
  const draws = await page.locator('[data-action=reset]').evaluate((button: HTMLButtonElement) => {
    let count = 0;
    const prototype = WebGL2RenderingContext.prototype;
    const original = prototype.drawElements;
    prototype.drawElements = function (...args) {
      count++;
      return original.apply(this, args);
    };
    try {
      button.click();
      return count;
    } finally {
      prototype.drawElements = original;
    }
  });
  expect(draws).toBe(1);
  expect(await values()).toEqual(initial);
  expect((await canvas.screenshot({ animations: 'disabled' })).equals(before)).toBe(true);
});
