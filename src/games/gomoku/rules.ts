// 五子棋规则：15 路，黑先，无禁手，五连及以上获胜。
import type { GameStatus } from '../../core/types';

export type Stone = 'b' | 'w';
export const SIZE = 15;
export const STONE_NAME: Record<Stone, string> = { b: '黑方', w: '白方' };
export interface GMove {
  at: number; // r * 15 + c
}

export interface GomokuState {
  board: (Stone | null)[];
  turn: Stone;
  lastMove: GMove | null;
  winLine: number[] | null; // 连成的那一串（含全部连续子）
  status: GameStatus;
  count: number;
}

const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

// 以 at 为中心找最长连线，长度 ≥ 5 返回整串
export function lineThrough(board: (Stone | null)[], at: number): number[] | null {
  const s = board[at];
  if (!s) return null;
  const r = Math.floor(at / SIZE);
  const c = at % SIZE;
  for (const [dr, dc] of DIRS) {
    const cells = [at];
    for (const sign of [1, -1]) {
      let rr = r + dr * sign;
      let cc = c + dc * sign;
      while (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && board[rr * SIZE + cc] === s) {
        cells.push(rr * SIZE + cc);
        rr += dr * sign;
        cc += dc * sign;
      }
    }
    if (cells.length >= 5) return cells.sort((a, b) => a - b);
  }
  return null;
}

export function replayGomoku(moves: GMove[]): GomokuState {
  const board: (Stone | null)[] = new Array(SIZE * SIZE).fill(null);
  let turn: Stone = 'b';
  let lastMove: GMove | null = null;
  let winLine: number[] | null = null;
  let count = 0;
  for (const m of moves) {
    if (winLine || m.at < 0 || m.at >= SIZE * SIZE || board[m.at]) break;
    board[m.at] = turn;
    lastMove = m;
    count++;
    winLine = lineThrough(board, m.at);
    turn = turn === 'b' ? 'w' : 'b';
  }
  let status: GameStatus = { kind: 'playing' };
  if (winLine) status = { kind: 'win', winner: board[winLine[0]]!, reason: '五子连珠' };
  else if (count === SIZE * SIZE) status = { kind: 'draw', reason: '棋盘已满' };
  return { board, turn, lastMove, winLine, status, count };
}
