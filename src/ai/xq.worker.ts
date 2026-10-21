// 中国象棋电脑：在 Worker 里跑象棋小巫师的搜索。
// 我们的格子编号 r*9+c ↔ 小巫师的 16x16 编号（x = c+3, y = r+3）。
import { COORD_XY, DST, FILE_X, LIMIT_DEPTH, MOVE, Position, RANK_Y, SRC, Search } from '../vendor/xqwlight/xqwlight.js';

const START = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
const toXq = (sq: number) => COORD_XY((sq % 9) + 3, Math.floor(sq / 9) + 3);
const fromXq = (sq: number) => (RANK_Y(sq) - 3) * 9 + (FILE_X(sq) - 3);

self.onmessage = (e: MessageEvent<{ moves: string[]; millis: number }>) => {
  const pos = new Position();
  pos.fromFen(START);
  for (const m of e.data.moves) {
    const [from, to] = m.split('-').map(Number);
    pos.makeMove(MOVE(toXq(from), toXq(to)));
  }
  const mv = new Search(pos, 16).searchMain(LIMIT_DEPTH, e.data.millis);
  self.postMessage(mv > 0 ? `${fromXq(SRC(mv))}-${fromXq(DST(mv))}` : null);
};
