// 通过真实界面测三种人机：进对局 → 人走一步（两下确认）→ 等电脑应子。用法：node scripts/ui-smoke.mjs [站点根地址]
import { chromium } from 'playwright';
const root = process.argv[2] ?? 'http://localhost:5188/';
// 本机 DNS 还没刷新时可设 QI_RESOLVE='MAP 域名 IP' 绕过
const b = await chromium.launch(process.env.QI_RESOLVE ? { args: [`--host-resolver-rules=${process.env.QI_RESOLVE}`] } : {});
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror:', e.message));
p.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()));
const t0 = Date.now();
const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', ...a);

await p.goto(root.replace(/\/$/, ''));
log('打开不带斜杠的地址后 URL =', p.url());

// 点击棋盘上第 col 列、第 row 行（从上往下）的格子中心
const tapCell = async (sel, cols, rows, col, row) => {
  const box = await p.locator(sel).boundingBox();
  await p.mouse.click(box.x + ((col + 0.5) / cols) * box.width, box.y + ((row + 0.5) / rows) * box.height);
};
const twice = async (fn) => {
  await fn();
  await p.waitForTimeout(150);
  await fn();
};

// 国际象棋：e2-e4
await p.goto(root + '#/play?game=chess&mode=ai&side=white&level=1');
await p.waitForSelector('cg-board piece');
await tapCell('cg-board', 8, 8, 4, 6);
await twice(() => tapCell('cg-board', 8, 8, 4, 4));
await p.waitForFunction(() => document.querySelectorAll('cg-board square.last-move').length === 2 && document.querySelector('.hint')?.textContent === '轮到你了', null, { timeout: 20000 });
log('国际象棋：电脑已应子');

// 中国象棋：炮二平五（第 7 行第 7 列 → 第 4 列）
await p.goto(root + '#/play?game=xiangqi&mode=ai&side=white&level=1');
await p.waitForSelector('cg-board piece');
await tapCell('cg-board', 9, 10, 7, 7);
await twice(() => tapCell('cg-board', 9, 10, 4, 7));
await p.waitForFunction(() => document.querySelector('.hint')?.textContent === '轮到你了' && document.querySelectorAll('cg-board square.last-move').length === 2, null, { timeout: 20000 });
log('中国象棋：电脑已应子', await p.locator('.player-bar').first().textContent());

// 五子棋：天元
await p.goto(root + '#/play?game=gomoku&mode=ai&side=black&level=1');
await p.waitForSelector('.gomoku-svg');
const box = await p.locator('.gomoku-svg').boundingBox();
const VIEW = 40 * 14 + 52;
const cx = box.x + ((26 + 7 * 40) / VIEW) * box.width;
const cy = box.y + ((26 + 7 * 40) / VIEW) * box.height;
await twice(() => p.mouse.click(cx, cy));
await p.waitForFunction(() => document.querySelectorAll('.stone:not(.pending)').length === 2, null, { timeout: 20000 });
log('五子棋：电脑已应子');
await b.close();
