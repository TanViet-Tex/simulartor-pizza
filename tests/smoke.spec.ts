import { expect, test } from '@playwright/test';

test('production canvas boots, renders and fits the mobile viewport', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  const canvas = page.locator('#game-container canvas');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-booted', 'true');
  await expect(canvas).toHaveAttribute('data-screen', 'menu');

  const bounds = await canvas.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(-1);
  expect(bounds!.y).toBeGreaterThanOrEqual(-1);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);

  const pixels = await canvas.evaluate(async (element) => {
    const source = element as HTMLCanvasElement;
    // Capture within a render frame so WebGL need not preserve its drawing buffer.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const probe = document.createElement('canvas');
    probe.width = source.width;
    probe.height = source.height;
    const context = probe.getContext('2d')!;
    context.drawImage(source, 0, 0);
    return {
      center: Array.from(context.getImageData(source.width / 2, source.height / 2, 1, 1).data),
      corner: Array.from(context.getImageData(4, 4, 1, 1).data),
    };
  });
  expect(pixels.center[3]).toBe(255);
  expect(pixels.corner[3]).toBe(255);
  expect(pixels.center).not.toEqual(pixels.corner);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('boot.png') });
  expect(errors).toEqual([]);
});
