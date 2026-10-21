// 生成安卓启动图标 + 启动页：用无头 Chromium 把 SVG 渲染成各尺寸 PNG
import { chromium } from 'playwright';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RES = 'android/app/src/main/res';
const disc = (s) => `
  <defs>
    <radialGradient id="wood" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#f3dcae"/><stop offset="70%" stop-color="#e2bd7f"/><stop offset="100%" stop-color="#c99a58"/>
    </radialGradient>
  </defs>
  <circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.34}" fill="url(#wood)"/>
  <circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.285}" fill="none" stroke="#b23a2e" stroke-width="${s * 0.018}"/>
  <text x="${s / 2}" y="${s / 2}" dy="0.35em" font-size="${s * 0.36}" text-anchor="middle" fill="#b23a2e"
        font-family="KaiTi, STKaiti, 'Noto Serif SC', serif" font-weight="700">弈</text>`;

// 完整图标（老系统用）：深色圆角底 + 木子
const full = (s, round) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  ${round ? `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="#262523"/>` : `<rect width="${s}" height="${s}" rx="${s * 0.2}" fill="#262523"/>`}
  ${disc(s)}</svg>`;
// 自适应图标前景：透明底，内容在中间 2/3
const fg = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <g transform="translate(${s * 0.18} ${s * 0.18}) scale(0.64)">${disc(s)}</g></svg>`;
const splash = (w, h) => {
  const s = Math.min(w, h) * 0.32;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#FAF9F7"/>
  <g transform="translate(${(w - s) / 2} ${(h - s) / 2})">${disc(s)}</g></svg>`;
};

const pngSize = (file) => {
  const b = readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

const browser = await chromium.launch();
const page = await browser.newPage();
const render = async (svg, w, h, out, transparent) => {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.screenshot({ path: out, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
};

const DENS = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(DENS)) {
  const dir = join(RES, `mipmap-${d}`);
  await render(full(48 * k, false), 48 * k, 48 * k, join(dir, 'ic_launcher.png'), true);
  await render(full(48 * k, true), 48 * k, 48 * k, join(dir, 'ic_launcher_round.png'), true);
  await render(fg(108 * k), 108 * k, 108 * k, join(dir, 'ic_launcher_foreground.png'), true);
}
for (const dir of readdirSync(RES).filter((d) => d.startsWith('drawable'))) {
  const f = join(RES, dir, 'splash.png');
  if (!existsSync(f)) continue;
  const { w, h } = pngSize(f);
  await render(splash(w, h), w, h, f, false);
}
// 网页图标
await render(full(512, false), 512, 512, 'public/icon-512.png', true);
await render(full(180, false), 180, 180, 'public/apple-touch-icon.png', false);
await browser.close();
console.log('icons done');
