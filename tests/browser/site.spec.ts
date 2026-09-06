import { expect, test } from '@playwright/test';

const rendererTimeout = process.env.CI ? 60_000 : 30_000;

test('首页与归档在桌面和移动视口均不横向溢出', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('main')).toBeVisible();
  const homeOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(homeOverflow).toBeLessThanOrEqual(1);

  await page.goto('./archive/');
  await expect(page.getByRole('link', { name: 'TSL Daily 首页' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '案例归档' })).toBeAttached();
  await expect(page.getByText('按日期发现灵感')).toHaveCount(0);

  const firstCard = page.locator('[data-case-card]:visible').first();
  const initialCardWidth = (await firstCard.boundingBox())?.width;
  const singleCaseTag = page.getByRole('button', { name: 'Domain Warp', exact: true });
  if (initialCardWidth && (await singleCaseTag.count()) > 0) {
    await singleCaseTag.click();
    await expect(page.locator('[data-case-card]:visible')).toHaveCount(1);
    const filteredCardWidth = (await firstCard.boundingBox())?.width;
    expect(filteredCardWidth).toBeCloseTo(initialCardWidth, 0);
  }

  const archiveOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(archiveOverflow).toBeLessThanOrEqual(1);
});

test('已提交案例可通过 WebGL2 后备路径启动', async ({ page }) => {
  await page.goto('./archive/');
  const firstCase = page.locator('[data-case-card] a').first();
  if ((await firstCase.count()) === 0) {
    await expect(page.getByText('首发集正在准备')).toBeVisible();
    return;
  }

  await firstCase.click();
  await page.goto(`${page.url()}?renderer=webgl`);
  await expect(page.locator('[data-shader-stage]')).toHaveAttribute('data-backend', 'webgl2', {
    timeout: rendererTimeout,
  });
  await expect(page.locator('[data-renderer-badge]')).toHaveText('WebGL2');

  await page.getByRole('button', { name: '阅读赏析' }).click();
  await expect(page.locator('[data-notes-dialog]')).toBeVisible();
  await expect(page.getByText('来源与许可', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看 TSL 源码' })).toHaveAttribute(
    'href',
    /\/src\/shaders\/cases\/.+\.ts$/,
  );
});

test('Star Nest 页面明确展示原作的 MIT 许可', async ({ page }) => {
  await page.goto('./shaders/star-nest/?renderer=webgl');
  await expect(page.locator('[data-shader-stage]')).toHaveAttribute('data-backend', 'webgl2', {
    timeout: rendererTimeout,
  });
  await expect(page.getByRole('heading', { name: '星巢' })).toBeVisible();

  await page.getByRole('button', { name: '阅读赏析' }).click();
  await expect(page.getByText('MIT（源码顶部显式声明）', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看 Shadertoy 原作' })).toHaveAttribute(
    'href',
    'https://www.shadertoy.com/view/XlfGRj',
  );
});

test('Seascape 后备渲染、许可与五个参数可用', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('./shaders/seascape/?renderer=webgl');
  await expect(page.locator('[data-shader-stage]')).toHaveClass(/is-ready/, {
    timeout: rendererTimeout,
  });
  await expect(page.locator('[data-renderer-badge]')).toHaveText('WebGL2');
  await page.getByRole('button', { name: '阅读赏析' }).click();
  await expect(
    page.getByText('CC BY-NC-SA 3.0（源码顶部显式声明）', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '查看 Shadertoy 原作' })).toHaveAttribute(
    'href',
    'https://www.shadertoy.com/view/Ms2SD1',
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '暂停动画' }).click();
  await page.getByRole('button', { name: '恢复默认参数' }).click();
  const sliders = page.locator('[data-parameter-list] input[type="range"]');
  await expect(sliders).toHaveCount(5);
  await page.locator('[data-quality]').selectOption('medium');
  const baseline = await sliders.evaluateAll((inputs) =>
    inputs.map((input) => (input as HTMLInputElement).value),
  );
  // Freeze time and isolate canvas pixels so UI changes cannot satisfy this assertion.
  await page.addStyleTag({
    content: '[data-shader-stage] > :not(canvas) { visibility: hidden !important; }',
  });
  const canvas = page.locator('[data-shader-canvas]');
  const before = await canvas.screenshot({ animations: 'disabled' });
  await page.locator('#seascape-height').evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = input.max;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('[data-quality]').selectOption('medium', { force: true });
  expect((await canvas.screenshot({ animations: 'disabled' })).equals(before)).toBe(false);
  await page
    .locator('[data-action="reset"]')
    .evaluate((element) => (element as HTMLButtonElement).click());
  await expect
    .poll(() =>
      sliders.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    )
    .toEqual(baseline);
  await page.locator('[data-quality]').selectOption('medium', { force: true });
  const restored = await canvas.screenshot({ animations: 'disabled' });
  if (!restored.equals(before)) {
    await testInfo.attach('before-reset', { body: before, contentType: 'image/png' });
    await testInfo.attach('after-reset', { body: restored, contentType: 'image/png' });
  }
  expect(restored.equals(before)).toBe(true);
  expect(errors).toEqual([]);
});

test('Star Nest 只在按下拖动时更新观察方向', async ({ page }) => {
  await page.goto('./shaders/star-nest/?renderer=webgl');
  await expect(page.locator('[data-shader-stage]')).toHaveAttribute('data-backend', 'webgl2', {
    timeout: rendererTimeout,
  });

  await page.getByRole('button', { name: '暂停动画' }).click();
  await page.getByRole('button', { name: '恢复默认参数' }).click();
  const canvas = page.locator('[data-shader-canvas]');
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) return;
  await page.addStyleTag({
    content: '[data-shader-stage] > :not([data-shader-canvas]) { visibility: hidden !important; }',
  });
  await page.waitForTimeout(400);

  const initialFrame = await canvas.screenshot();
  await page.mouse.move(bounds.x + bounds.width * 0.78, bounds.y + bounds.height * 0.38);
  await page.locator('[data-quality]').selectOption('auto', { force: true });
  await page.waitForTimeout(100);
  const hoverFrame = await canvas.screenshot();
  expect(hoverFrame.equals(initialFrame)).toBe(true);

  await page.mouse.move(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.78, bounds.y + bounds.height * 0.38, {
    steps: 4,
  });
  await page.mouse.up();
  await page.locator('[data-quality]').selectOption('auto', { force: true });
  await page.waitForTimeout(100);
  const dragFrame = await canvas.screenshot();
  expect(dragFrame.equals(initialFrame)).toBe(false);
});

for (const slug of ['star-nest', 'seascape']) {
  test(`${slug} visibilitychange 会暂停并恢复实时渲染`, async ({ page }) => {
    await page.goto(`./shaders/${slug}/`);
    await expect(page.locator('[data-shader-stage]')).toHaveAttribute(
      'data-backend',
      /webgpu|webgl2/,
      { timeout: rendererTimeout },
    );

    await page.evaluate(() => {
      const testWindow = window as typeof window & { __tslDailyDocumentHidden?: boolean };
      testWindow.__tslDailyDocumentHidden = true;
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => Boolean(testWindow.__tslDailyDocumentHidden),
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByRole('button', { name: '播放动画' })).toBeVisible();

    await page.evaluate(() => {
      const testWindow = window as typeof window & { __tslDailyDocumentHidden?: boolean };
      testWindow.__tslDailyDocumentHidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByRole('button', { name: '暂停动画' })).toBeVisible();
  });
}

test.describe('减少动态效果', () => {
  test('先显示静态替身，再由用户主动播放', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./archive/');
    const firstCase = page.locator('[data-case-card] a').first();
    if ((await firstCase.count()) === 0) return;
    await firstCase.click();
    await expect(page.locator('[data-renderer-badge]')).toHaveText('减少动态效果');
    await page.getByRole('button', { name: '播放动画' }).click();
    await expect(page.locator('[data-shader-stage]')).toHaveAttribute(
      'data-backend',
      /webgpu|webgl2/,
      {
        timeout: rendererTimeout,
      },
    );
  });
});
