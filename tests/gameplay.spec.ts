import { expect, test } from '@playwright/test';

test('touch market, cook, deliver, pause and reload checkpoint', async ({ page }, testInfo) => {
  test.setTimeout(65000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?mode=campaign');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('aria-label', /start/);
  const tap = async (x: number, y: number) => {
    const b = (await canvas.boundingBox())!;
    await page.touchscreen.tap(b.x + x * b.width / 360, b.y + y * b.height / 640);
  };
  await tap(150, 498);
  await expect(canvas).toHaveAttribute('aria-label', /game, market/);
  await tap(150, 473);
  for (const y of [157, 216, 275, 334]) await tap(309, y);
  await page.screenshot({ path: testInfo.outputPath('market.png') });
  await tap(150, 603);
  await expect(canvas).toHaveAttribute('aria-label', /shop/);
  await expect.poll(async () => JSON.parse((await canvas.getAttribute('data-tickets')) ?? '[]').length, { timeout: 18000 }).toBe(1);
  await expect(canvas).toHaveAttribute('data-offer', '');
  await expect(canvas).toHaveAttribute('data-paused', '');
  await page.screenshot({ path: testInfo.outputPath('automatic-order.png') });
  await expect(canvas).toHaveAttribute('aria-label', /Đã tạo đơn/);
  for (const x of [45, 112, 179]) await tap(x, 518);
  await tap(180, 437);
  await expect(canvas).toHaveAttribute('aria-label', /Nướng 3–5 giây/);
  await expect.poll(() => canvas.getAttribute('data-oven').then(Number), { timeout: 15000 }).toBeGreaterThanOrEqual(3);
  await tap(180, 437);
  await expect(canvas).toHaveAttribute('aria-label', /Bánh vừa chín/);
  await page.screenshot({ path: testInfo.outputPath('kitchen.png') });
  await tap(180, 437);
  await expect(canvas).toHaveAttribute('aria-label', /Đã giao: 5 sao/);
  await tap(28, 24);
  await expect(canvas).toHaveAttribute('data-paused', 'user');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.screenshot({ path: testInfo.outputPath('pause.png') });
  await tap(140, 471);
  await expect(canvas).toHaveAttribute('data-paused', 'visibility');
  await tap(140, 471);
  await expect(canvas).toHaveAttribute('data-paused', '');
  await page.reload();
  await expect(canvas).toHaveAttribute('aria-label', /start, market, ngày 1/);
  expect(errors).toEqual([]);
});

test('failed initial save keeps player out of an unsaved campaign', async ({ page }) => {
  await page.goto('/?mode=campaign');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('aria-label', /start/);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  const b = (await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x + 150 * b.width / 360, b.y + 498 * b.height / 640);
  await expect(canvas).toHaveAttribute('aria-label', /start.*Storage full/);
});

test('corrupt checkpoint is reported without silently resetting', async ({ page }) => {
  await page.goto('/?mode=campaign');
  await expect(page.locator('canvas')).toHaveAttribute('aria-label', /start/);
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('pizza-demo-checkpoints', 1);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('checkpoints', 'readwrite');
        tx.objectStore('checkpoints').put({ schemaVersion: 900 }, 'active');
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
  await page.reload();
  await expect(page.locator('canvas')).toHaveAttribute('aria-label', /error/);
});
