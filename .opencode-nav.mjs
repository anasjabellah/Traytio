import { chromium } from "@playwright/test";

const BASE = process.env.BASE || "http://127.0.0.1:3100";
const browser = await chromium.launch();

const widths = [320, 360, 390, 428, 1440];
let problems = 0;

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const nav = document.querySelector("nav[aria-label='Navigation principale']");
    const nb = nav.getBoundingClientRect();
    const logo = document.querySelector("a[aria-label='Accueil TUR']");
    const burger = document.querySelector("button[aria-label='Ouvrir le menu']");
    const burgerComputed = burger ? getComputedStyle(burger) : null;
    // all "Commencer" links, tagged with whether they're inside the sheet drawer vs navbar
    const ctaLinks = [...document.querySelectorAll("a")].filter((a) => a.textContent.trim() === "Commencer").map((a) => {
      const cs = getComputedStyle(a);
      const b = a.getBoundingClientRect();
      const inSheet = !!a.closest("[role='dialog'], [data-slot], [data-closed]") || !nav.contains(a.parentElement?.closest("div") || a);
      return {
        display: cs.display,
        width: Math.round(b.width),
        inNavDirect: !!a.closest("nav[aria-label='Navigation principale']"),
        insideSheet: !!a.closest("[role='dialog']"),
        rectW: Math.round(b.width * 100) / 100,
      };
    });
    const lb = logo.getBoundingClientRect();
    const bb = burger.getBoundingClientRect();
    return {
      nav: { x: nb.x, y: nb.y, w: nb.width, h: nb.height, centerY: nb.y + nb.height / 2 },
      logo: { x: lb.x, w: lb.width, centerY: lb.y + lb.height / 2 },
      burger: { x: bb.x, w: bb.width, centerY: bb.y + bb.height / 2, display: burgerComputed ? burgerComputed.display : "no-element" },
      ctaLinks,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const lines = [];
  const isMobile = width < 1024;

  // The NAVBAR CTA is the inline-flex link whose parent div is the nav's right cluster.
  // It must have display:none on mobile and inline-flex on desktop.
  const navCta = r.ctaLinks.find((c) => c.inNavDirect && !c.insideSheet);
  if (isMobile) {
    const ok = navCta && navCta.display === "none";
    if (!ok) problems++;
    lines.push(`navbar CTA display=${navCta ? navCta.display : "NOT-FOUND"} (expect none) ${ok ? "OK" : "FAIL"}`);
  } else {
    const ok = navCta && navCta.display === "inline-flex";
    if (!ok) problems++;
    lines.push(`navbar CTA display=${navCta ? navCta.display : "NOT-FOUND"} (expect inline-flex) ${ok ? "OK" : "FAIL"}`);
  }
  lines.push(`drawer CTA present-in-DOM: ${r.ctaLinks.some((c) => c.insideSheet) ? "yes" : "no"} (must stay)`);

  if (r.logo.x >= r.nav.x && r.burger.w > 0) {
    const centeredLogo = Math.abs(r.logo.centerY - r.nav.centerY) < 1.5;
    const centeredBurger = Math.abs(r.burger.centerY - r.nav.centerY) < 1.5;
    if (!centeredLogo || !centeredBurger) problems++;
    lines.push(`vert-center logo=${(r.logo.centerY - r.nav.centerY).toFixed(1)}px burger=${(r.burger.centerY - r.nav.centerY).toFixed(1)}px ${centeredLogo && centeredBurger ? "OK" : "FAIL"}`);
  }
  if (isMobile && r.burger.w > 0) {
    const logoRight = r.logo.x + r.logo.w;
    const gap = r.burger.x - logoRight;
    lines.push(`logo..burger gap: ${Math.round(gap)}px (no leftover CTA slot)`);
    if (gap < 20) { lines.push(`  -> gap suspiciously small FAIL`); problems++; }
  }
  const overflowOK = r.overflowX <= 0;
  if (!overflowOK) problems++;
  lines.push(`overflow-x: ${r.overflowX}px ${overflowOK ? "OK" : "FAIL"}`);

  console.log(`=== ${width}px ===`);
  lines.forEach((l) => console.log("  " + l));
  console.log(`  [cta detail] ${JSON.stringify(r.ctaLinks)}`);
  await page.close();
}

console.log(`\nSUMMARY: problems=${problems}`);
await browser.close();
