// Visual QA: captures pages at 390 / 768 / 1440 widths and reports horizontal
// overflow and console errors. Usage:
//   node scripts/screenshots.mjs <baseUrl> <outDir> [path ...]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [base = 'http://localhost:4321', out = 'screenshots', ...paths] = process.argv.slice(2);
const routes = paths.length ? paths : ['/'];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
let problems = 0;
for (const width of [390, 768, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : width === 768 ? 1024 : 900 }, deviceScaleFactor: 1, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference', hasTouch: width < 1000, isMobile: width === 390 });
  for (const route of routes) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && !(route !== '/' && /status of 404/.test(m.text())) && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    const name = `${out}/${route.replace(/\W+/g, '_') || 'home'}-${width}`;
    await page.screenshot({ path: `${name}.png` });
    // Scroll through to trigger reveals, then capture full page.
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${name}-full.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal],[data-hero-in]')].filter((el) => { const s = getComputedStyle(el); return el.getClientRects().length && (s.opacity === '0' || s.visibility === 'hidden'); }).length);
    console.log(`${route} @${width}: status ${res?.status()} overflow ${overflow}px hidden-after-scroll ${hidden} errors ${errors.length}`);
    errors.forEach((e) => console.log('   ', e));
    if (overflow > 0 || errors.length || hidden) problems++;
    await page.close();
  }
  await ctx.close();
}
await browser.close();
process.exitCode = problems ? 1 : 0;
