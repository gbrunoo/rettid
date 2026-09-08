/*
 * Screenshot helper for iterating on the voyager layout.
 *
 * Renders a few representative pages at a phone viewport so the skin can be
 * checked visually instead of by reading markup. Development aid only; not
 * used at runtime.
 *
 * Usage: node scripts/shoot.mjs [baseUrl] [outDir]
 */
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:8099";
const outDir = process.argv[3] ?? "/tmp/skin";

const PAGES = [
  { name: "feed", path: "/r/pics" },
  { name: "settings", path: "/settings" },
  { name: "search", path: "/search?q=rust" },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  ...devices["iPhone 13"],
  // The layout is cookie-driven, so set the preference rather than relying on
  // instance defaults.
  extraHTTPHeaders: { Cookie: "layout=voyager; theme=voyagerDark" },
});

const page = await context.newPage();
const problems = [];

page.on("console", (msg) => {
  if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
});
page.on("requestfailed", (req) => {
  problems.push(`failed: ${req.url()} (${req.failure()?.errorText})`);
});

/* Discover a real permalink so the comment view can be checked too. */
await page.goto(`${base}/r/pics`, { waitUntil: "domcontentloaded" });
const permalink = await page
  .locator('.post_title a[href*="/comments/"]')
  .first()
  .getAttribute("href")
  .catch(() => null);

if (permalink) PAGES.push({ name: "post", path: permalink });

for (const { name, path } of PAGES) {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  /* Let sticky/fixed bars settle and lazy images start. */
  await page.waitForTimeout(700);

  await page.screenshot({ path: `${outDir}/${name}.png` });

  /* Report geometry that CSS alone can't confirm. */
  const geometry = await page.evaluate(() => {
    const rect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const { top, bottom, left, width, height } = el.getBoundingClientRect();
      return {
        top: Math.round(top),
        bottom: Math.round(bottom),
        left: Math.round(left),
        width: Math.round(width),
        height: Math.round(height),
        position: getComputedStyle(el).position,
      };
    };
    return {
      viewport: { w: innerWidth, h: innerHeight },
      topNav: rect("nav:not(#v_tabbar)"),
      tabBar: rect("#v_tabbar"),
      firstPost: rect(".post"),
      postsCard: rect("#posts"),
      overflowX: document.documentElement.scrollWidth > innerWidth,
    };
  });

  console.log(`\n=== ${name} (${path}) ===`);
  console.log(JSON.stringify(geometry, null, 1));
}

if (problems.length) {
  console.log("\n=== page problems ===");
  for (const p of [...new Set(problems)]) console.log("  " + p);
}

await browser.close();
