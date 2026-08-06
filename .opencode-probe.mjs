import { chromium } from "@playwright/test";
const BASE = process.env.BASE || "http://127.0.0.1:3100";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(400);
const cdp = await page.context().newCDPSession(page);
await cdp.send("DOM.enable");
await cdp.send("CSS.enable");
const nodeId = await cdp.send("DOM.getDocument").then((r) => r.root.nodeId);
const evalRes = await cdp.send("Runtime.evaluate", {
  expression: `(() => {
    const nav = document.querySelector("nav[aria-label='Navigation principale']");
    const el = [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "Commencer" && nav.contains(a));
    return el;
  })()`,
  returnByValue: false,
});
const obj = await cdp.send("DOM.describeNode", { objectId: evalRes.result.objectId });
const reqNode = await cdp.send("DOM.requestNode", { objectId: evalRes.result.objectId });
const elNodeId = reqNode.nodeId;
const matched = await cdp.send("CSS.getMatchedStylesForNode", { nodeId: elNodeId });
const displays = [];
for (const m of matched.matchedCSSRules || []) {
  for (const rule of m.rules || []) {
    const disp = (rule.style || {}).cssText;
    if (disp && disp.includes("display")) {
      displays.push({ origin: m.origin, selectorText: rule.selectorText, cssText: (rule.style || {}).cssText });
    }
  }
}
console.log(JSON.stringify(displays, null, 1));
await browser.close();
