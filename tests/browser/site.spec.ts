import { expect, test } from '@playwright/test';

test('首页与归档在桌面和移动视口均不横向溢出', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('main')).toBeVisible();
  const homeOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(homeOverflow).toBeLessThanOrEqual(1);

  await page.goto('./archive/');
  await expect(page.getByRole('heading', { name: '按日期发现灵感' })).toBeVisible();
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
    timeout: 30_000,
  });
  await expect(page.locator('[data-renderer-badge]')).toHaveText('WebGL2');

  await page.getByRole('button', { name: '阅读赏析' }).click();
  await expect(page.locator('[data-notes-dialog]')).toBeVisible();
  await expect(page.getByText('来源与许可', { exact: true })).toBeVisible();
});

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
        timeout: 30_000,
      },
    );
  });
});
