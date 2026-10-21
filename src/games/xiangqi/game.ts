// 中国象棋对局层：重放着法、判定胜负。
import {
  type Side,
  type XMove,
  type XPosition,
  type XType,
  findGeneral,
  initialXPosition,
  otherSide,
  xInCheck,
  xKey,
  xLegalMoves,
  xMake,
} from './rules';

export type XStatus =
  | { kind: 'playing' }
  | { kind: 'win'; winner: Side; reason: string }
  | { kind: 'draw'; reason: string };

export interface XiangqiState {
  pos: XPosition;
  legal: XMove[];
  lastMove: XMove | null;
  checkSq: number;
  captured: Record<Side, XType[]>; // 某方吃掉的子
  status: XStatus;
  applied: number; // 实际走成的步数（遇到非法着法就停）
}

export const SIDE_NAME: Record<Side, string> = { r: '红方', b: '黑方' };
const ATTACKERS: XType[] = ['r', 'n', 'c', 'p'];

export function replayXiangqi(moves: XMove[], start: XPosition = initialXPosition()): XiangqiState {
  const pos = start;
  const firstMover = pos.turn;
  const keys = [xKey(pos)];
  const checks = [false]; // checks[i]：第 i 步走完是否将军
  const captured: Record<Side, XType[]> = { r: [], b: [] };
  let legal = xLegalMoves(pos);
  let lastMove: XMove | null = null;
  let applied = 0;
  for (const m of moves) {
    if (!legal.some((x) => x.from === m.from && x.to === m.to)) break;
    const mover = pos.turn;
    const u = xMake(pos, m);
    if (u.captured) captured[mover].push(u.captured.t);
    lastMove = { from: m.from, to: m.to };
    applied++;
    keys.push(xKey(pos));
    checks.push(xInCheck(pos));
    legal = xLegalMoves(pos);
  }
  const check = checks[checks.length - 1];
  return {
    pos,
    legal,
    lastMove,
    checkSq: check ? findGeneral(pos.board, pos.turn) : -1,
    captured,
    status: xiangqiStatus(pos, legal, check, keys, checks, firstMover),
    applied,
  };
}

function xiangqiStatus(
  pos: XPosition,
  legal: XMove[],
  check: boolean,
  keys: string[],
  checks: boolean[],
  firstMover: Side,
): XStatus {
  const winner = otherSide(pos.turn);
  if (legal.length === 0) return { kind: 'win', winner, reason: check ? '绝杀' : '困毙' };

  const n = keys.length - 1;
  const first = keys.indexOf(keys[n]);
  const repeats = keys.filter((k) => k === keys[n]).length;
  if (repeats >= 3) {
    // 循环里的着法是第 first+1 … n 步；第 i 步的走子方：i 为奇数是开局先走的一方
    const allCheck: Record<Side, boolean> = { r: true, b: true };
    for (let i = first + 1; i <= n; i++) {
      const mover: Side = i % 2 === 1 ? firstMover : otherSide(firstMover);
      if (!checks[i]) allCheck[mover] = false;
    }
    if (allCheck.r !== allCheck.b) {
      const loser: Side = allCheck.r ? 'r' : 'b';
      return { kind: 'win', winner: otherSide(loser), reason: '长将判负' };
    }
    return { kind: 'draw', reason: '重复局面' };
  }
  if (pos.quiet >= 120) return { kind: 'draw', reason: '60 回合未吃子' };
  if (!pos.board.some((p) => p && ATTACKERS.includes(p.t))) return { kind: 'draw', reason: '双方均无进攻子力' };
  return { kind: 'playing' };
}
