// 中国象棋：自研规则（perft 已验证）转成 chessgroundx 要的形状。
// 着法字符串 = "起点-终点"（格子编号 r*9+c）；棋盘上红方 = white，在下方。
import type { Key } from 'chessgroundx/types';
import type { Color, GameStatus } from '../../core/types';
import { replayXiangqi } from './game';
import type { Side, XMove } from './rules';

const FILES = 'abcdefghi';
const RANKS = '123456789:'; // chessgroundx 用 ':' 表示第 10 行

export const sqToKey = (sq: number): Key => (FILES[sq % 9] + RANKS[9 - Math.floor(sq / 9)]) as Key;
export const keyToSq = (k: string): number => (9 - RANKS.indexOf(k[1])) * 9 + FILES.indexOf(k[0]);
export const encodeXMove = (m: XMove) => `${m.from}-${m.to}`;
export function decodeXMove(s: string): XMove {
  const [from, to] = s.split('-').map(Number);
  return { from, to };
}
const toColor = (s: Side): Color => (s === 'r' ? 'white' : 'black');

export interface XiangqiView {
  fen: string;
  turn: Color;
  dests: Map<Key, Key[]>;
  lastMove?: [Key, Key];
  check: boolean;
  status: GameStatus;
  captured: Record<Color, string[]>;
  moveCount: number;
}

export function replayXiangqiView(moves: string[]): XiangqiView {
  const decoded = moves.map(decodeXMove);
  const s = replayXiangqi(decoded);
  const rows: string[] = [];
  for (let r = 0; r < 10; r++) {
    let row = '';
    let empty = 0;
    for (let c = 0; c < 9; c++) {
      const p = s.pos.board[r * 9 + c];
      if (!p) {
        empty++;
        continue;
      }
      if (empty) row += empty;
      empty = 0;
      row += p.s === 'r' ? p.t.toUpperCase() : p.t;
    }
    if (empty) row += empty;
    rows.push(row);
  }
  const dests = new Map<Key, Key[]>();
  for (const m of s.legal) {
    const k = sqToKey(m.from);
    const list = dests.get(k) ?? [];
    list.push(sqToKey(m.to));
    dests.set(k, list);
  }
  const status: GameStatus =
    s.status.kind === 'win' ? { kind: 'win', winner: toColor(s.status.winner), reason: s.status.reason } : s.status;
  return {
    fen: rows.join('/'),
    turn: toColor(s.pos.turn),
    dests,
    lastMove: s.lastMove ? [sqToKey(s.lastMove.from), sqToKey(s.lastMove.to)] : undefined,
    check: s.checkSq >= 0,
    status,
    captured: { white: s.captured.r, black: s.captured.b },
    moveCount: s.applied,
  };
}
