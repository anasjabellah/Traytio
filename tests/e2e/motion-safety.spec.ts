import { test, expect, type Page } from '@playwright/test';

const SELECTORS: Record<string, string> = {
  form: 'text=Demander ma démo',
  benefits: 'text=Démo personnalisée 7 jours',
  timeline: 'text=Validation sous 24h',
  stats: 'text=Sécurité & RGPD',
  navbar: 'nav[aria-label="Navigation principale"]',
};

async function throttleCpu(page: Page, factor: number) {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: factor });
}

test.describe.configure({ timeout: 240000 });

async function assertSectionVisible(page: Page, label: string, selector: string) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'attached', timeout: 60000 });
  const opacity = await el.evaluate((n) => getComputedStyle(n).opacity);
  const visible = await el.isVisible();
  console.log(`  [${label}] visible=${visible} opacity=${opacity}`);
  expect(visible, `${label} must be visible`).toBe(true);
}

test.describe('demo page motion safety net', () => {
  test('hard reload under 4x CPU throttle shows all content', async ({ page }) => {
    await throttleCpu(page, 4);
    for (let run = 0; run < 4; run++) {
      console.log(`--- hard-reload run ${run + 1} ---`);
      await page.goto('/demo', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3500);
      for (const [label, sel] of Object.entries(SELECTORS)) {
        await assertSectionVisible(page, label, sel);
      }
    }
  });

  test('client-side navigation under 4x CPU throttle shows all content', async ({ page }) => {
    await throttleCpu(page, 4);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    for (let run = 0; run < 4; run++) {
      console.log(`--- nav run ${run + 1} ---`);
      await page.goto('/demo', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3500);
      for (const [label, sel] of Object.entries(SELECTORS)) {
        await assertSectionVisible(page, label, sel);
      }
    }
  });
});
