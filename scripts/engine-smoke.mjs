// 无头 Chromium 打开 dev-engines.html，跑一遍三个引擎封装（需要 dev server 在 5188）
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', (e) => console.log('pageerror:', e.message));
p.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()));
await p.goto('http://localhost:5188/dev-engines.html');
await p.waitForFunction(() => window.done === true, null, { timeout: 60000 });
console.log((await p.evaluate(() => window.results)).join('\n'));
await b.close();
