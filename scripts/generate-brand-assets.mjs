// Renders the default social sharing image and favicons from HTML using the
// site's self-hosted fonts. Usage: node scripts/generate-brand-assets.mjs
// Requires a Chromium binary (set CHROMIUM_PATH, default /opt/pw-browsers/chromium).
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const font = (p) => `data:font/woff2;base64,${readFileSync(root + 'node_modules/' + p).toString('base64')}`;
const anton = font('@fontsource/anton/files/anton-latin-400-normal.woff2');
const serif = font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2');
const mono = font('@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2');

const css = `
@font-face{font-family:A;src:url(${anton})}
@font-face{font-family:S;font-style:italic;src:url(${serif})}
@font-face{font-family:M;src:url(${mono})}
*{margin:0;box-sizing:border-box}
body{background:#0A0A0B;color:#F2F0EA;overflow:hidden}
`;

const og = `<html><head><style>${css}
.c{position:relative;width:1200px;height:630px;padding:56px 64px;display:flex;flex-direction:column;justify-content:space-between;
background:radial-gradient(55% 70% at 85% 20%,rgba(66,117,255,.38),transparent 70%),linear-gradient(90deg,transparent,rgba(66,117,255,.6) 50%,transparent) 0 64% / 100% 2px no-repeat,#0A0A0B}
.t{display:flex;justify-content:space-between;font:500 18px M;letter-spacing:.16em;text-transform:uppercase;color:#A3A3AA}
.t b{color:#F2F0EA;font-weight:500}
.n{font:206px/0.8 A;text-transform:uppercase;letter-spacing:-.01em;margin-left:-6px}
.h{font:italic 48px/1.02 S;position:absolute;right:64px;top:322px;text-align:right}
.h span{color:#A3A3AA}
.b{display:flex;justify-content:space-between;font:500 18px M;letter-spacing:.16em;text-transform:uppercase;color:#A3A3AA}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#4275FF;margin-right:14px;box-shadow:0 0 16px #4275FF}
</style></head><body><div class="c">
<div class="t"><span><b>Wizard</b> Fingers</span><span>wizardfingers.com</span></div>
<p class="h">Imagination in motion.<br><span>Ideas made real.</span></p>
<p class="n">Pranav</p>
<div class="b"><span><i class="dot"></i>Creative Technologist</span><span>Motion · Intelligence · Digital</span></div>
</div></body></html>`;

const icon = (size) => `<html><head><style>${css}
.i{width:${size}px;height:${size}px;display:grid;place-items:center;background:#0A0A0B;border-radius:${size * 0.22}px;position:relative;overflow:hidden}
.i::after{content:'';position:absolute;inset:0;background:radial-gradient(60% 60% at 80% 15%,rgba(66,117,255,.55),transparent 70%)}
.w{position:relative;z-index:1;font:${size * 0.6}px/1 A;color:#F2F0EA;letter-spacing:-.02em;transform:translateY(${size * 0.02}px)}
.w i{font:italic ${size * 0.66}px/1 S;color:#4275FF;margin-left:-${size * 0.03}px}
</style></head><body style="background:transparent"><div class="i"><span class="w">W<i>f</i></span></div></body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(og);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: root + 'public/og/default.png' });

for (const [size, file] of [[180, 'apple-touch-icon.png'], [512, 'icon-512.png'], [192, 'icon-192.png'], [64, 'favicon-64.png']]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(icon(size));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: root + 'public/' + file, omitBackground: true });
}
await browser.close();

await sharp(root + 'public/favicon-64.png').resize(32, 32).png().toFile(root + 'public/favicon-32.png');
await sharp(root + 'public/og/default.png').png({ compressionLevel: 9, palette: false }).toBuffer().then((b) => writeFileSync(root + 'public/og/default.png', b));
console.log('Brand assets written to public/');
