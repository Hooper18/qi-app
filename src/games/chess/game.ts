// 国际象棋对局层：从着法列表重放出当前局面，并判定胜负和棋。
import {
  type Color,
  type IMove,
  type Move,
  type Piece,
  type PieceType,
  type Position,
  fileOf,
  findKing,
  inCheck,
  initialPosition,
  legalMoves,
  makeMove,
  rankOf,
} from './rules';
import type { GameStatus } from '../../core/types';

export interface ChessState {
  pos: Position;
  legal: IMove[];
  lastMove: Move | null;
  checkSq: number; // 被将军的王所在格，没有为 -1
  captured: Record<Color, PieceType[]>; // 某方吃掉的子
  status: GameStatus;
  keys: string[];
}

const sameMove = (a: Move, b: Move) => a.from === b.from && a.to === b.to && (a.promo ?? null) === (b.promo ?? null);

export function findLegal(state: ChessState, m: Move): IMove | undefined {
  return state.legal.find((x) => sameMove(x, m));
}

export function replayChess(moves: Move[]): ChessState {
  const pos = initialPosition();
  const keys = [positionKey(pos)];
  const captured: Record<Color, PieceType[]> = { w: [], b: [] };
  let lastMove: Move | null = null;
  let legal = legalMoves(pos);
  for (const m of moves) {
    const im = legal.find((x) => sameMove(x, m));
    if (!im) break; // 非法着法（数据损坏）就停在这里
    const mover = pos.turn;
    const u = makeMove(pos, im);
    if (u.captured) captured[mover].push(u.captured.t);
    lastMove = { from: im.from, to: im.to, promo: im.promo };
    keys.push(positionKey(pos));
    legal = legalMoves(pos);
  }
  const check = inCheck(pos);
  return {
    pos,
    legal,
    lastMove,
    checkSq: check ? findKing(pos.board, pos.turn) : -1,
    captured,
    status: chessStatus(pos, legal, check, keys),
    keys,
  };
}

function chessStatus(pos: Position, legal: IMove[], check: boolean, keys: string[]): GameStatus {
  const opp = pos.turn === 'w' ? 'b' : 'w';
  if (legal.length === 0) {
    return check ? { kind: 'win', winner: opp, reason: '将死' } : { kind: 'draw', reason: '逼和' };
  }
  if (insufficientMaterial(pos.board)) return { kind: 'draw', reason: '子力不足' };
  if (pos.halfmove >= 100) return { kind: 'draw', reason: '50 回合无吃子无动兵' };
  const last = keys[keys.length - 1];
  if (keys.filter((k) => k === last).length >= 3) return { kind: 'draw', reason: '三次重复局面' };
  return { kind: 'playing' };
}

export function pieceAt(state: ChessState, sq: number): Piece | null {
  return state.pos.board[sq];
}

// 重复局面判定用的键：只有真能吃过路兵时才把过路兵格算进去
function positionKey(pos: Position): string {
  let s = '';
  for (const p of pos.board) s += p ? (p.c === 'w' ? p.t.toUpperCase() : p.t) : '.';
  let ep = -1;
  if (pos.ep >= 0) {
    const pawnRank = rankOf(pos.ep) + (pos.turn === 'w' ? 1 : -1);
    for (const df of [-1, 1]) {
      const f = fileOf(pos.ep) + df;
      if (f < 0 || f > 7) continue;
      const p = pos.board[pawnRank * 8 + f];
      if (p && p.t === 'p' && p.c === pos.turn) ep = pos.ep;
    }
  }
  return `${s}${pos.turn}${pos.castling}${ep}`;
}

function insufficientMaterial(board: (Piece | null)[]): boolean {
  const minors: { t: PieceType; color: number }[] = [];
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || p.t === 'k') continue;
    if (p.t === 'p' || p.t === 'r' || p.t === 'q') return false;
    minors.push({ t: p.t, color: (rankOf(i) + fileOf(i)) & 1 });
  }
  if (minors.length <= 1) return true;
  // 只剩象且全在同色格上
  return minors.every((m) => m.t === 'b') && minors.every((m) => m.color === minors[0].color);
}
