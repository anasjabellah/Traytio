# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: motion-safety.spec.ts >> demo page motion safety net >> client-side navigation under 4x CPU throttle shows all content
- Location: tests\e2e\motion-safety.spec.ts:40:7

# Error details

```
TimeoutError: locator.waitFor: Timeout 60000ms exceeded.
Call log:
  - waiting for locator('text=Demander ma démo').first()

```

# Page snapshot

```yaml
- generic:
  - generic [active]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - navigation [ref=e6]:
            - button "previous" [disabled] [ref=e7]:
              - img "previous" [ref=e8]
            - generic [ref=e10]:
              - generic [ref=e11]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e12]:
              - img "next" [ref=e13]
          - img
        - generic [ref=e15]:
          - link "Next.js 16.2.6 (stale) Turbopack" [ref=e16] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
            - img [ref=e17]
            - generic "There is a newer version (16.2.12) available, upgrade recommended!" [ref=e19]: Next.js 16.2.6 (stale)
            - generic [ref=e20]: Turbopack
          - img
      - dialog "Build Error" [ref=e22]:
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e29]: Build Error
              - generic [ref=e30]:
                - button "Copy Error Info" [ref=e31] [cursor=pointer]:
                  - img [ref=e32]
                - button "No related documentation found" [disabled] [ref=e34]:
                  - img [ref=e35]
                - button "Attach Node.js inspector" [ref=e37] [cursor=pointer]:
                  - img [ref=e38]
            - generic [ref=e47]: Parsing CSS source code failed
          - generic [ref=e49]:
            - generic [ref=e51]:
              - img [ref=e53]
              - generic [ref=e55]: ./src/app/globals.css (4982:16)
              - button "Open in editor" [ref=e56] [cursor=pointer]:
                - img [ref=e58]
            - generic [ref=e61]:
              - generic [ref=e62]: Parsing CSS source code failed
              - generic [ref=e63]: 4980 |
              - generic [ref=e64]: "}"
              - generic [ref=e65]: 4981 |
              - generic [ref=e66]: .text-\[
              - text: var\(-\@�\10
              - generic [ref=e67]: "-"
              - text: W\7
              - generic [ref=e68]: \
              - text: "11"
              - generic [ref=e69]: g��
              - text: "0"
              - generic [ref=e70]: "\\)\\] {"
              - text: ">"
              - generic [ref=e71]: 4982 |
              - generic [ref=e72]: "color:"
              - text: "var(-@\x00\x10-W\x07\x11g�\x000"
              - generic [ref=e73]: );
              - generic [ref=e74]: "|"
              - text: ^
              - generic [ref=e75]: 4983 |
              - generic [ref=e76]: "}"
              - generic [ref=e77]: 4984 |
              - generic [ref=e78]: .text-amber-
              - text: "400"
              - generic [ref=e79]: "{"
              - generic [ref=e80]: 4985 |
              - generic [ref=e81]: "color:"
              - text: var(--color-amber-400
              - generic [ref=e82]: "); Unexpected token Delim('-') Generated code of PostCSS transform of file content of src/app/globals.css: ./src/app/globals.css:4982:16"
              - generic [ref=e83]: 4980 |
              - generic [ref=e84]: "}"
              - generic [ref=e85]: 4981 |
              - generic [ref=e86]: .text-\[
              - text: var\(-\@�\10
              - generic [ref=e87]: "-"
              - text: W\7
              - generic [ref=e88]: \
              - text: "11"
              - generic [ref=e89]: g��
              - text: "0"
              - generic [ref=e90]: "\\)\\] {"
              - text: ">"
              - generic [ref=e91]: 4982 |
              - generic [ref=e92]: "color:"
              - text: "var(-@\x00\x10-W\x07\x11g�\x000"
              - generic [ref=e93]: );
              - generic [ref=e94]: "|"
              - text: ^
              - generic [ref=e95]: 4983 |
              - generic [ref=e96]: "}"
              - generic [ref=e97]: 4984 |
              - generic [ref=e98]: .text-amber-
              - text: "400"
              - generic [ref=e99]: "{"
              - generic [ref=e100]: 4985 |
              - generic [ref=e101]: "color:"
              - text: var(--color-amber-400
              - generic [ref=e102]: "); Import trace: Client Component Browser: ./src/app/globals.css [Client Component Browser] ./src/app/layout.tsx [Server Component]"
        - generic [ref=e103]: "1"
        - generic [ref=e104]: "2"
    - generic [ref=e109] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e110]:
        - img [ref=e111]
      - button "Open issues overlay" [ref=e115]:
        - generic [ref=e116]:
          - generic [ref=e117]: "0"
          - generic [ref=e118]: "1"
        - generic [ref=e119]: Issue
  - alert [ref=e120]
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | 
  3  | const SELECTORS: Record<string, string> = {
  4  |   form: 'text=Demander ma démo',
  5  |   benefits: 'text=Démo personnalisée 7 jours',
  6  |   timeline: 'text=Validation sous 24h',
  7  |   stats: 'text=Sécurité & RGPD',
  8  |   navbar: 'nav[aria-label="Navigation principale"]',
  9  | };
  10 | 
  11 | async function throttleCpu(page: Page, factor: number) {
  12 |   const session = await page.context().newCDPSession(page);
  13 |   await session.send('Emulation.setCPUThrottlingRate', { rate: factor });
  14 | }
  15 | 
  16 | test.describe.configure({ timeout: 240000 });
  17 | 
  18 | async function assertSectionVisible(page: Page, label: string, selector: string) {
  19 |   const el = page.locator(selector).first();
> 20 |   await el.waitFor({ state: 'attached', timeout: 60000 });
     |            ^ TimeoutError: locator.waitFor: Timeout 60000ms exceeded.
  21 |   const opacity = await el.evaluate((n) => getComputedStyle(n).opacity);
  22 |   const visible = await el.isVisible();
  23 |   console.log(`  [${label}] visible=${visible} opacity=${opacity}`);
  24 |   expect(visible, `${label} must be visible`).toBe(true);
  25 | }
  26 | 
  27 | test.describe('demo page motion safety net', () => {
  28 |   test('hard reload under 4x CPU throttle shows all content', async ({ page }) => {
  29 |     await throttleCpu(page, 4);
  30 |     for (let run = 0; run < 4; run++) {
  31 |       console.log(`--- hard-reload run ${run + 1} ---`);
  32 |       await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  33 |       await page.waitForTimeout(3500);
  34 |       for (const [label, sel] of Object.entries(SELECTORS)) {
  35 |         await assertSectionVisible(page, label, sel);
  36 |       }
  37 |     }
  38 |   });
  39 | 
  40 |   test('client-side navigation under 4x CPU throttle shows all content', async ({ page }) => {
  41 |     await throttleCpu(page, 4);
  42 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  43 |     for (let run = 0; run < 4; run++) {
  44 |       console.log(`--- nav run ${run + 1} ---`);
  45 |       await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  46 |       await page.waitForTimeout(3500);
  47 |       for (const [label, sel] of Object.entries(SELECTORS)) {
  48 |         await assertSectionVisible(page, label, sel);
  49 |       }
  50 |     }
  51 |   });
  52 | });
  53 | 
```