// 复现真机反馈：手机触控模拟下 ① 选子后可走点 ② 将军提示 ③ 输赢提示
import { chromium, devices } from 'playwright';
const root = process.argv[2] ?? 'http://localhost:5188/';
const b = await chromium.launch(process.env.QI_RESOLVE ? { args: [`--host-resolver-rules=${process.env.QI_RESOLVE}`] } : {});
const ctx = await b.newContext({ ...devices['Pixel 7'] });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror:', e.message));
const save = (game, moves, side = 'white') =>
  p.evaluate(([g, m, s]) => localStorage.setItem(`qi:game:${g}:ai`, JSON.stringify({ moves: m, humanSide: s, level: 1, updatedAt: Date.now() })), [game, moves, side]);
const tap = async (sel, cols, rows, c, r) => {
  const box = await p.locator(sel).boundingBox();
  await p.touchscreen.tap(box.x + ((c + 0.5) / cols) * box.width, box.y + ((r + 0.5) / rows) * box.height);
  await p.waitForTimeout(200);
};
await p.goto(root);

// ① 选子后可走点（中国象棋 炮）
await p.goto(root + '#/play?game=xiangqi&mode=ai&side=white&level=1&t=1');
await p.waitForSelector('cg-board piece');
await tap('cg-board', 9, 10, 7, 7);
const dests = await p.evaluate(() => [...document.querySelectorAll('cg-board square')].map((s) => s.className));
console.log('象棋选炮后 square 类：', JSON.stringify(dests.reduce((a, c) => ((a[c] = (a[c] || 0) + 1), a), {})));
const bg = await p.evaluate(() => {
  const s = document.querySelector('cg-board square.move-dest');
  return s ? getComputedStyle(s).backgroundImage.slice(0, 80) : 'none';
});
console.log('move-dest 背景：', bg);
await p.screenshot({ path: process.env.SHOT_DIR + '/xq-select.png' });
// 选着炮再点一个空着但走不到的点
await tap('cg-board', 9, 10, 5, 8);
console.log('点不能走的位置后提示：', await p.locator('.toast').textContent().catch(() => '无'));
await p.screenshot({ path: process.env.SHOT_DIR + '/xq-illegal.png' });


// ② 将军：国际象棋 人执白，走 Bb5+ 前局面
await p.goto(root);
await save('chess', ['e2e4', 'd7d6']);
await p.goto(root + '#/play?game=chess&mode=ai&resume=1&t=2');
await p.waitForSelector('cg-board piece');
await tap('cg-board', 8, 8, 5, 7); // f1
await tap('cg-board', 8, 8, 1, 3); // b5
await tap('cg-board', 8, 8, 1, 3);
await p.waitForTimeout(250);
console.log('将军横幅：', await p.locator('.board-banner').textContent().catch(() => '无'));
await p.screenshot({ path: process.env.SHOT_DIR + '/chess-check-banner.png' });
await p.waitForTimeout(300);
console.log('白方 Bb5+ 后提示：', await p.textContent('.hint'), '| check 格：', await p.locator('cg-board square.check').count());
await p.screenshot({ path: process.env.SHOT_DIR + '/chess-check.png' });

// ③ 输：人执白，电脑一步杀（愚者将杀）
await p.goto(root);
await save('chess', ['f2f3', 'e7e5']);
await p.goto(root + '#/play?game=chess&mode=ai&resume=1&t=3');
await p.waitForSelector('cg-board piece');
await tap('cg-board', 8, 8, 6, 6); // g2
await tap('cg-board', 8, 8, 6, 4); // g4
await tap('cg-board', 8, 8, 6, 4);
await p.waitForFunction(() => document.querySelector('.board-banner'), null, { timeout: 15000 });
console.log('输棋横幅：', await p.locator('.board-banner').textContent(), '| 此时结果面板=', await p.locator('.result-sheet').count());
await p.screenshot({ path: process.env.SHOT_DIR + '/chess-lose-banner.png' });
await p.waitForTimeout(2000);
console.log('电脑将死后：hint=', await p.textContent('.hint'), '| 结果面板=', await p.locator('.result-sheet').count(), '| 标题=', await p.locator('.result-title').textContent().catch(() => '-'));
await p.screenshot({ path: process.env.SHOT_DIR + '/chess-lose.png' });
await b.close();
