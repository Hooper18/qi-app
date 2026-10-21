// 两个无头页面模拟两台手机：A 建五子棋房间，B 用房间号加入，A 落子后检查 B 能看到；再测悔棋请求/同意
import { chromium } from 'playwright';
const code = String(Math.floor(1000 + Math.random() * 9000));
const base = process.argv[2] ?? 'http://localhost:5188/';
const b = await chromium.launch();
const mk = async (name) => {
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log(name, 'pageerror:', e.message));
  p.on('console', (m) => m.type() === 'error' && console.log(name, 'console error:', m.text()));
  return p;
};
const A = await mk('A');
const B = await mk('B');
const log = (...a) => console.log(new Date().toISOString().slice(17, 23), ...a);
await A.goto(`${base}#/room/${code}?game=gomoku&host=1`);
await A.waitForSelector('.gomoku-svg', { timeout: 15000 });
log('A 建房', code, await A.textContent('.room-banner'));
await B.goto(`${base}#/room/${code}`);
await B.waitForSelector('.gomoku-svg', { timeout: 20000 });
log('B 进房', await B.textContent('.room-banner'));
await A.waitForFunction(() => document.querySelector('.room-banner')?.textContent?.includes('对方在线'), null, { timeout: 15000 });
log('A 看到', await A.textContent('.room-banner'));
const tap = async (p, r, c) => {
  const box = await p.locator('.gomoku-svg').boundingBox();
  const VIEW = 40 * 14 + 52;
  const x = box.x + ((26 + c * 40) / VIEW) * box.width;
  const y = box.y + ((26 + r * 40) / VIEW) * box.height;
  await p.mouse.click(x, y);
  await p.waitForTimeout(80);
  await p.mouse.click(x, y);
};
log('A hint:', await A.textContent('.hint'), '| B hint:', await B.textContent('.hint'));
await tap(A, 7, 7);
await B.waitForFunction(() => document.querySelectorAll('.stone:not(.pending)').length === 1, null, { timeout: 10000 });
log('B 收到 A 的第一手；B hint:', await B.textContent('.hint'));
await tap(B, 7, 8);
await A.waitForFunction(() => document.querySelectorAll('.stone:not(.pending)').length === 2, null, { timeout: 10000 });
log('A 收到 B 的应手');
// B 请求悔棋，A 同意
await B.getByRole('button', { name: '悔棋' }).click();
await A.waitForSelector('text=对方请求悔棋', { timeout: 10000 });
log('A 收到悔棋请求');
await A.getByRole('button', { name: '同意' }).click();
await B.waitForFunction(() => document.querySelectorAll('.stone:not(.pending)').length === 1, null, { timeout: 10000 });
log('悔棋后 B 棋盘剩 1 子；B toast:', await B.locator('.toast').textContent().catch(() => '-'));
// B 刷新页面后状态还在
await B.reload();
await B.waitForSelector('.gomoku-svg', { timeout: 20000 });
await B.waitForTimeout(1500);
log('B 刷新后子数', await B.evaluate(() => document.querySelectorAll('.stone:not(.pending)').length));
await b.close();
log('完成');
