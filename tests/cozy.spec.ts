import { expect, test, type Page } from '@playwright/test';

type Control = { id: string; x: number; y: number; width: number; height: number; enabled: boolean };

async function tapControl(page: Page, id: string) {
  const canvas = page.locator('canvas');
  // Phaser commits the next set of input regions on the following render frame.
  await expect.poll(async () => {
    const current: Control[] = JSON.parse((await canvas.getAttribute('data-controls')) ?? '[]');
    return current.some(item => item.id === id && item.enabled);
  }, { message: `control becomes actionable: ${id}` }).toBe(true);
  const controls: Control[] = JSON.parse((await canvas.getAttribute('data-controls'))!);
  const control = controls.find(item => item.id === id);
  expect(control, `visible control: ${id}`).toBeDefined();
  expect(control!.enabled, `enabled control: ${id}`).toBe(true);
  const bounds = (await canvas.boundingBox())!;
  expect(control!.width * bounds.width / 360, `${id} CSS width`).toBeGreaterThanOrEqual(48);
  expect(control!.height * bounds.height / 640, `${id} CSS height`).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(
    bounds.x + (control!.x + control!.width / 2) * bounds.width / 360,
    bounds.y + (control!.y + control!.height / 2) * bounds.height / 640,
  );
}

test('Day 1 touch preview: read order, assemble, bake, box and deliver once', async ({ page }, testInfo) => {
  test.setTimeout(65000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?mode=freeplay');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-stage', 'assembly');
  await expect(canvas).toHaveAttribute('data-cash', '300');
  const initialControls: Control[] = JSON.parse((await canvas.getAttribute('data-controls'))!);
  const bounds = (await canvas.boundingBox())!;
  for (const control of initialControls) {
    expect(control.width * bounds.width / 360, control.id).toBeGreaterThanOrEqual(48);
    expect(control.height * bounds.height / 640, control.id).toBeGreaterThanOrEqual(48);
    expect(control.x).toBeGreaterThanOrEqual(0);
    expect(control.y).toBeGreaterThanOrEqual(0);
    expect(control.x + control.width).toBeLessThanOrEqual(360);
    expect(control.y + control.height).toBeLessThanOrEqual(640);
  }
  for (const id of ['bake', 'box', 'deliver']) {
    const control = initialControls.find(item => item.id === id);
    if (control) expect(control.enabled).toBe(false);
  }
  await page.screenshot({ path: testInfo.outputPath('cozy-day-one.png') });
  await tapControl(page, 'customer-linh');
  await tapControl(page, 'order');
  await expect(canvas).toHaveAttribute('data-paused', /order/);
  await page.screenshot({ path: testInfo.outputPath('cozy-order.png') });
  await tapControl(page, 'close-order');
  await expect(canvas).toHaveAttribute('data-paused', '');
  await tapControl(page, 'customer-linh');
  await expect(canvas).toHaveAttribute('data-paused', '');
  await tapControl(page, 'order');
  await expect(canvas).toHaveAttribute('data-paused', 'order');
  await tapControl(page, 'close-order');
  await tapControl(page, 'recipe-0');
  await expect(canvas).toHaveAttribute('data-paused', 'order');
  await tapControl(page, 'close-order');
  await tapControl(page, 'dough');
  await tapControl(page, 'sauce');
  await page.screenshot({ path: testInfo.outputPath('reference-sauce-layer.png') });
  await tapControl(page, 'clear');
  await expect(canvas).toHaveAttribute('data-ingredients', '');
  await expect(canvas).toHaveAttribute('data-cash', '300');
  await tapControl(page, 'dough');
  await tapControl(page, 'sauce');
  await expect(canvas).toHaveAttribute('data-stage', 'assembly');
  await tapControl(page, 'cheese');
  await tapControl(page, 'bake');
  await expect(canvas).toHaveAttribute('data-stage', 'baking');
  await tapControl(page, 'pause');
  await expect(canvas).toHaveAttribute('data-paused', 'user');
  const pausedTime = await canvas.getAttribute('data-oven');
  await page.waitForTimeout(300);
  await expect(canvas).toHaveAttribute('data-oven', pausedTime!);
  await tapControl(page, 'resume');
  await expect(canvas).toHaveAttribute('data-heat', 'perfect', { timeout: 14000 });
  await tapControl(page, 'extract');
  await expect(canvas).toHaveAttribute('data-stage', 'ready');
  await page.screenshot({ path: testInfo.outputPath('cozy-ready.png') });
  await tapControl(page, 'box');
  await expect(canvas).toHaveAttribute('data-stage', 'boxed');
  await expect(canvas).toHaveAttribute('data-cash', '300');
  await page.screenshot({ path: testInfo.outputPath('cozy-boxed-reference.png') });
  await tapControl(page, 'deliver');
  await expect(canvas).toHaveAttribute('data-stage', 'delivered');
  await expect(canvas).toHaveAttribute('data-cash', '350');
  await page.screenshot({ path: testInfo.outputPath('cozy-delivered.png') });
  await tapControl(page, 'replay');
  await expect(canvas).toHaveAttribute('data-stage', 'assembly');
  await expect(canvas).toHaveAttribute('data-cash', '300');
  expect(errors).toEqual([]);
});

test('leaving pizza past the green window burns it and allows a fresh attempt', async ({ page }, testInfo) => {
  test.setTimeout(45000);
  await page.goto('/?mode=freeplay');
  const canvas=page.locator('canvas');
  for(const id of ['dough','sauce','cheese','bake'])await tapControl(page,id);
  await expect(canvas).toHaveAttribute('data-stage','baking');
  const controls:Control[]=JSON.parse((await canvas.getAttribute('data-controls'))!);
  expect(controls.find(c=>c.id==='extract')?.enabled).toBe(false);
  await page.screenshot({path:testInfo.outputPath('two-ovens-baking.png')});
  // Headless WebKit's render clock can run slower than wall time on this host.
  // The domain test verifies the exact 5-second boundary without real waits.
  await expect(canvas).toHaveAttribute('data-stage','burnt',{timeout:30000});
  await page.screenshot({path:testInfo.outputPath('two-ovens-burnt.png')});
  await tapControl(page,'discard');
  await expect(canvas).toHaveAttribute('data-stage','assembly');
  await expect(canvas).toHaveAttribute('data-ingredients','');
  await expect(canvas).toHaveAttribute('data-cash','300');
  for(const id of ['dough','sauce','cheese','bake'])await tapControl(page,id);
  await expect(canvas).toHaveAttribute('data-stage','baking');
});

test('preview protects nested pauses, orientation and does not access campaign storage', async ({ page }) => {
  test.setTimeout(65000);
  await page.addInitScript(() => {
    // Preview must stay usable even when campaign storage is unavailable.
    IDBFactory.prototype.open = () => { throw new Error('Preview attempted campaign storage access'); };
  });
  await page.goto('/?mode=freeplay');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-stage', 'assembly');
  await tapControl(page, 'pause');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(canvas).toHaveAttribute('data-paused', /visibility/);
  await tapControl(page, 'resume');
  await expect(canvas).toHaveAttribute('data-paused', 'user');
  await tapControl(page, 'resume');
  await expect(canvas).toHaveAttribute('data-paused', '');
  await tapControl(page, 'customer-linh');
  await tapControl(page, 'order');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(canvas).toHaveAttribute('data-paused', /visibility/);
  // Resume only the currently displayed owner until the explicit order can close.
  await tapControl(page, 'resume');
  await expect(canvas).toHaveAttribute('data-paused', 'order');
  await tapControl(page, 'close-order');
  await expect(canvas).toHaveAttribute('data-paused', '');
  const original = page.viewportSize()!;
  await page.setViewportSize({ width: original.height, height: original.width });
  await expect(canvas).not.toHaveAttribute('data-paused', /orientation/);
  await expect(page.locator('#orientation-notice')).toHaveCount(0);
  await page.setViewportSize(original);
  await expect(canvas).toHaveAttribute('data-paused', '');
  await expect(canvas).toHaveAttribute('data-stage', 'assembly');
});
