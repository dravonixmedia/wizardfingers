// Generates abstract, clearly-artificial placeholder images used ONLY by
// development sample content (src/content/samples.ts). Not real work.
// Usage: node scripts/generate-samples.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../src/media/_samples/', import.meta.url));
mkdirSync(out, { recursive: true });

const label = (w, h) =>
  `<text x="${w * 0.04}" y="${h - w * 0.04}" font-family="monospace" font-size="${Math.round(w * 0.018)}" fill="#A3A3AA" letter-spacing="4">SAMPLE · PLACEHOLDER</text>`;

const variants = {
  'cover-a': [2400, 1350, (w, h) => `
    <radialGradient id="g" cx="65%" cy="45%" r="60%"><stop offset="0" stop-color="#2b2b30"/><stop offset="1" stop-color="#0A0A0B"/></radialGradient>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <rect x="0" y="${h * 0.47}" width="${w}" height="${h * 0.02}" fill="#4275FF" opacity=".55" filter="url(#b)"/>
    <circle cx="${w * 0.65}" cy="${h * 0.48}" r="${h * 0.18}" fill="#F2F0EA" opacity=".08"/>`],
  'cover-b': [2000, 2500, (w, h) => {
    let dots = '';
    for (let i = 0; i < 900; i++) {
      const a = i * 2.39996, r = Math.sqrt(i) * w * 0.016;
      dots += `<circle cx="${w / 2 + Math.cos(a) * r}" cy="${h * 0.45 + Math.sin(a) * r}" r="${2 + (i % 5)}" fill="${i % 7 ? '#F2F0EA' : '#4275FF'}" opacity="${0.15 + (i % 10) / 25}"/>`;
    }
    return `<rect width="${w}" height="${h}" fill="#0A0A0B"/>${dots}`;
  }],
  'cover-c': [2400, 1500, (w, h) => {
    let grid = '';
    for (let x = 0; x < w; x += 80) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#F2F0EA" stroke-opacity=".05"/>`;
    for (let y = 0; y < h; y += 80) grid += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#F2F0EA" stroke-opacity=".05"/>`;
    return `<rect width="${w}" height="${h}" fill="#111113"/>${grid}
      <rect x="${w * 0.15}" y="${h * 0.15}" width="${w * 0.7}" height="${h * 0.7}" fill="#171719" stroke="#F2F0EA" stroke-opacity=".2"/>
      <rect x="${w * 0.15}" y="${h * 0.15}" width="${w * 0.7}" height="${h * 0.06}" fill="#1f1f22"/>
      <rect x="${w * 0.2}" y="${h * 0.35}" width="${w * 0.35}" height="${h * 0.08}" fill="#F2F0EA" opacity=".85"/>
      <rect x="${w * 0.2}" y="${h * 0.48}" width="${w * 0.25}" height="${h * 0.02}" fill="#A3A3AA"/>
      <rect x="${w * 0.6}" y="${h * 0.3}" width="${w * 0.2}" height="${h * 0.45}" fill="#4275FF" opacity=".6"/>`;
  }],
  'cover-d': [1800, 2400, (w, h) => `
    <linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#202024"/><stop offset="1" stop-color="#0A0A0B"/></linearGradient>
    <rect width="${w}" height="${h}" fill="url(#l)"/>
    <rect x="${w * 0.42}" y="0" width="${w * 0.16}" height="${h}" fill="#F2F0EA" opacity=".07"/>
    <ellipse cx="${w * 0.5}" cy="${h * 0.8}" rx="${w * 0.4}" ry="${h * 0.05}" fill="#4275FF" opacity=".35" filter="url(#b)"/>`],
  'cover-e': [2400, 1600, (w, h) => {
    let bars = '';
    for (let i = 0; i < 14; i++) bars += `<rect x="${w * 0.1 + i * w * 0.058}" y="${h * (0.7 - ((i * 37) % 50) / 100)}" width="${w * 0.03}" height="${h * (((i * 37) % 50) / 100)}" fill="${i === 9 ? '#4275FF' : '#F2F0EA'}" opacity="${i === 9 ? 0.9 : 0.18}"/>`;
    return `<rect width="${w}" height="${h}" fill="#0E0E10"/>${bars}<line x1="${w * 0.08}" y1="${h * 0.7}" x2="${w * 0.92}" y2="${h * 0.7}" stroke="#F2F0EA" stroke-opacity=".3"/>`;
  }],
  'still-wide': [2400, 1004, (w, h) => `
    <rect width="${w}" height="${h}" fill="#0A0A0B"/>
    <circle cx="${w * 0.3}" cy="${h * 0.5}" r="${h * 0.35}" fill="none" stroke="#F2F0EA" stroke-opacity=".2" stroke-width="2"/>
    <circle cx="${w * 0.7}" cy="${h * 0.5}" r="${h * 0.2}" fill="#4275FF" opacity=".3" filter="url(#b)"/>`],
  'still-tall': [1600, 2400, (w, h) => `
    <rect width="${w}" height="${h}" fill="#141416"/>
    <path d="M0 ${h * 0.7} Q ${w / 2} ${h * 0.4} ${w} ${h * 0.75} L ${w} ${h} L 0 ${h}Z" fill="#F2F0EA" opacity=".06"/>
    <circle cx="${w * 0.5}" cy="${h * 0.3}" r="${w * 0.12}" fill="#F2F0EA" opacity=".12"/>`],
  'still-square': [1600, 1600, (w, h) => `
    <rect width="${w}" height="${h}" fill="#0A0A0B"/>
    <rect x="${w * 0.2}" y="${h * 0.2}" width="${w * 0.6}" height="${h * 0.6}" fill="none" stroke="#4275FF" stroke-opacity=".6" stroke-width="3" transform="rotate(12 ${w / 2} ${h / 2})"/>
    <rect x="${w * 0.25}" y="${h * 0.25}" width="${w * 0.5}" height="${h * 0.5}" fill="#F2F0EA" opacity=".05"/>`],
};

for (const [name, [w, h, body]] of Object.entries(variants)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><filter id="b"><feGaussianBlur stdDeviation="${w * 0.02}"/></filter></defs>${body(w, h)}${label(w, h)}</svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(`${out}${name}.jpg`);
  console.log('wrote', name);
}
