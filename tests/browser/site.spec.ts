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
