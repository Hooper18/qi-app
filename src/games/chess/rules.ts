// 国际象棋规则：可变棋盘 + make/unmake，界面和电脑搜索共用这一份实现。
// 格子编号 sq = r * 8 + f，r = 0 是第 8 横排（黑方底线），f = 0 是 a 列。

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export interface Piece {
  c: Color;
  t: PieceType;
  id: number;
}

export interface Move {
  from: number;
  to: number;
  promo?: PieceType;
}

// 内部着法：flag 0 普通，1 吃过路兵，2 王车易位，3 兵走两格
export interface IMove extends Move {
  flag: number;
}

export interface Position {
  board: (Piece | null)[];
  turn: Color;
  castling: number; // 1 白短 2 白长 4 黑短 8 黑长
  ep: number; // 过路兵目标格，没有为 -1
  halfmove: number;
  fullmove: number;
}

export interface Undo {
  move: IMove;
  captured: Piece | null;
  capturedAt: number;
  castling: number;
  ep: number;
  halfmove: number;
  movedType: PieceType;
}

export const WK = 1;
export const WQ = 2;
export const BK = 4;
export const BQ = 8;

export const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');
export const rankOf = (sq: number) => sq >> 3;
export const fileOf = (sq: number) => sq & 7;
export const sqName = (sq: number) => 'abcdefgh'[fileOf(sq)] + String(8 - rankOf(sq));
export const sqFromName = (n: string) => (8 - Number(n[1])) * 8 + (n.charCodeAt(0) - 97);

const KNIGHT = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1],
];
const KING = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
];
const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

const CASTLE_MASK = new Array<number>(64).fill(15);
CASTLE_MASK[60] = 15 & ~(WK | WQ);
CASTLE_MASK[63] = 15 & ~WK;
CASTLE_MASK[56] = 15 & ~WQ;
CASTLE_MASK[4] = 15 & ~(BK | BQ);
CASTLE_MASK[7] = 15 & ~BK;
CASTLE_MASK[0] = 15 & ~BQ;

const inside = (r: number, f: number) => r >= 0 && r < 8 && f >= 0 && f < 8;

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function fromFEN(fen: string): Position {
  const [placement, turn, castle, ep, half, full] = fen.trim().split(/\s+/);
  const board: (Piece | null)[] = new Array(64).fill(null);
  let sq = 0;
  let id = 1;
  for (const ch of placement) {
    if (ch === '/') continue;
    if (/\d/.test(ch)) {
      sq += Number(ch);
      continue;
    }
    const lower = ch.toLowerCase() as PieceType;
    board[sq++] = { c: ch === lower ? 'b' : 'w', t: lower, id: id++ };
  }
  let castling = 0;
  if (castle.includes('K')) castling |= WK;
  if (castle.includes('Q')) castling |= WQ;
  if (castle.includes('k')) castling |= BK;
  if (castle.includes('q')) castling |= BQ;
  return {
    board,
    turn: turn === 'b' ? 'b' : 'w',
    castling,
    ep: ep && ep !== '-' ? sqFromName(ep) : -1,
    halfmove: Number(half ?? 0),
    fullmove: Number(full ?? 1),
  };
}

export function toFEN(pos: Position): string {
  let s = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = pos.board[r * 8 + f];
      if (!p) {
        empty++;
        continue;
      }
      if (empty) s += empty;
      empty = 0;
      s += p.c === 'w' ? p.t.toUpperCase() : p.t;
    }
    if (empty) s += empty;
    if (r < 7) s += '/';
  }
  let c = '';
  if (pos.castling & WK) c += 'K';
  if (pos.castling & WQ) c += 'Q';
  if (pos.castling & BK) c += 'k';
  if (pos.castling & BQ) c += 'q';
  return `${s} ${pos.turn} ${c || '-'} ${pos.ep >= 0 ? sqName(pos.ep) : '-'} ${pos.halfmove} ${pos.fullmove}`;
}

export const initialPosition = () => fromFEN(START_FEN);

export function clonePosition(pos: Position): Position {
  return { ...pos, board: pos.board.slice() };
}

export function isAttacked(board: (Piece | null)[], sq: number, by: Color): boolean {
  const r = rankOf(sq);
  const f = fileOf(sq);
  // 兵：白兵从下往上吃，所以攻击 sq 的白兵在 r+1 行
  const pr = by === 'w' ? r + 1 : r - 1;
  for (const df of [-1, 1]) {
    if (inside(pr, f + df)) {
      const p = board[pr * 8 + f + df];
      if (p && p.c === by && p.t === 'p') return true;
    }
  }
  for (const [dr, df] of KNIGHT) {
    if (!inside(r + dr, f + df)) continue;
    const p = board[(r + dr) * 8 + f + df];
    if (p && p.c === by && p.t === 'n') return true;
  }
  for (const [dr, df] of KING) {
    if (!inside(r + dr, f + df)) continue;
    const p = board[(r + dr) * 8 + f + df];
    if (p && p.c === by && p.t === 'k') return true;
  }
  for (const [dr, df] of ROOK_DIRS) {
    let rr = r + dr;
    let ff = f + df;
    while (inside(rr, ff)) {
      const p = board[rr * 8 + ff];
      if (p) {
        if (p.c === by && (p.t === 'r' || p.t === 'q')) return true;
        break;
      }
      rr += dr;
      ff += df;
    }
  }
  for (const [dr, df] of BISHOP_DIRS) {
    let rr = r + dr;
    let ff = f + df;
    while (inside(rr, ff)) {
      const p = board[rr * 8 + ff];
      if (p) {
        if (p.c === by && (p.t === 'b' || p.t === 'q')) return true;
        break;
      }
      rr += dr;
      ff += df;
    }
  }
  return false;
}

export function findKing(board: (Piece | null)[], c: Color): number {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.t === 'k' && p.c === c) return i;
  }
  return -1;
}

export function inCheck(pos: Position, c: Color = pos.turn): boolean {
  const k = findKing(pos.board, c);
  return k >= 0 && isAttacked(pos.board, k, other(c));
}

function pushPawnMove(list: IMove[], from: number, to: number, flag: number) {
  const r = rankOf(to);
  if (r === 0 || r === 7) {
    for (const t of ['q', 'r', 'b', 'n'] as PieceType[]) list.push({ from, to, promo: t, flag });
  } else {
    list.push({ from, to, flag });
  }
}

export function pseudoMoves(pos: Position, capturesOnly = false): IMove[] {
  const list: IMove[] = [];
  const { board, turn } = pos;
  const them = other(turn);
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (!p || p.c !== turn) continue;
    const r = rankOf(sq);
    const f = fileOf(sq);
    if (p.t === 'p') {
      const dir = turn === 'w' ? -1 : 1;
      const startRank = turn === 'w' ? 6 : 1;
      const r1 = r + dir;
      if (inside(r1, f) && !capturesOnly) {
        if (!board[r1 * 8 + f]) {
          pushPawnMove(list, sq, r1 * 8 + f, 0);
          const r2 = r + 2 * dir;
          if (r === startRank && !board[r2 * 8 + f]) list.push({ from: sq, to: r2 * 8 + f, flag: 3 });
        }
      } else if (inside(r1, f) && capturesOnly && (r1 === 0 || r1 === 7) && !board[r1 * 8 + f]) {
        // 静态搜索里把升变也当作"吵闹"着法
        list.push({ from: sq, to: r1 * 8 + f, promo: 'q', flag: 0 });
      }
      for (const df of [-1, 1]) {
        if (!inside(r1, f + df)) continue;
        const to = r1 * 8 + f + df;
        const t = board[to];
        if (t && t.c === them) pushPawnMove(list, sq, to, 0);
        else if (to === pos.ep) list.push({ from: sq, to, flag: 1 });
      }
      continue;
    }
    if (p.t === 'n' || p.t === 'k') {
      for (const [dr, df] of p.t === 'n' ? KNIGHT : KING) {
        if (!inside(r + dr, f + df)) continue;
        const to = (r + dr) * 8 + f + df;
        const t = board[to];
        if (t ? t.c === them : !capturesOnly) list.push({ from: sq, to, flag: 0 });
      }
      if (p.t === 'k' && !capturesOnly) genCastles(pos, sq, list);
      continue;
    }
    const dirs = p.t === 'r' ? ROOK_DIRS : p.t === 'b' ? BISHOP_DIRS : [...ROOK_DIRS, ...BISHOP_DIRS];
    for (const [dr, df] of dirs) {
      let rr = r + dr;
      let ff = f + df;
      while (inside(rr, ff)) {
        const to = rr * 8 + ff;
        const t = board[to];
        if (t) {
          if (t.c === them) list.push({ from: sq, to, flag: 0 });
          break;
        }
        if (!capturesOnly) list.push({ from: sq, to, flag: 0 });
        rr += dr;
        ff += df;
      }
    }
  }
  return list;
}

function genCastles(pos: Position, sq: number, list: IMove[]) {
  const { board, turn, castling } = pos;
  const them = other(turn);
  const home = turn === 'w' ? 60 : 4;
  if (sq !== home) return;
  const kingSide = turn === 'w' ? WK : BK;
  const queenSide = turn === 'w' ? WQ : BQ;
  if (!(castling & (kingSide | queenSide))) return;
  if (isAttacked(board, home, them)) return;
  if (castling & kingSide && !board[home + 1] && !board[home + 2]) {
    const rook = board[home + 3];
    if (rook && rook.t === 'r' && rook.c === turn && !isAttacked(board, home + 1, them) && !isAttacked(board, home + 2, them)) {
      list.push({ from: home, to: home + 2, flag: 2 });
    }
  }
  if (castling & queenSide && !board[home - 1] && !board[home - 2] && !board[home - 3]) {
    const rook = board[home - 4];
    if (rook && rook.t === 'r' && rook.c === turn && !isAttacked(board, home - 1, them) && !isAttacked(board, home - 2, them)) {
      list.push({ from: home, to: home - 2, flag: 2 });
    }
  }
}

export function makeMove(pos: Position, m: IMove): Undo {
  const { board } = pos;
  const piece = board[m.from]!;
  const undo: Undo = {
    move: m,
    captured: null,
    capturedAt: m.to,
    castling: pos.castling,
    ep: pos.ep,
    halfmove: pos.halfmove,
    movedType: piece.t,
  };
  if (m.flag === 1) {
    undo.capturedAt = m.to + (piece.c === 'w' ? 8 : -8);
  }
  undo.captured = board[undo.capturedAt];
  board[undo.capturedAt] = null;
  board[m.from] = null;
  board[m.to] = m.promo ? { c: piece.c, t: m.promo, id: piece.id } : piece;
  if (m.flag === 2) {
    const kingSide = m.to > m.from;
    const rookFrom = kingSide ? m.from + 3 : m.from - 4;
    const rookTo = kingSide ? m.from + 1 : m.from - 1;
    board[rookTo] = board[rookFrom];
    board[rookFrom] = null;
  }
  pos.castling &= CASTLE_MASK[m.from] & CASTLE_MASK[m.to];
  pos.ep = m.flag === 3 ? (m.from + m.to) >> 1 : -1;
  pos.halfmove = piece.t === 'p' || undo.captured ? 0 : pos.halfmove + 1;
  if (pos.turn === 'b') pos.fullmove++;
  pos.turn = other(pos.turn);
  return undo;
}

export function unmakeMove(pos: Position, u: Undo) {
  const { board } = pos;
  const m = u.move;
  pos.turn = other(pos.turn);
  if (pos.turn === 'b') pos.fullmove--;
  const piece = board[m.to]!;
  board[m.from] = m.promo ? { c: piece.c, t: 'p', id: piece.id } : piece;
  board[m.to] = null;
  board[u.capturedAt] = u.captured;
  if (m.flag === 2) {
    const kingSide = m.to > m.from;
    const rookFrom = kingSide ? m.from + 3 : m.from - 4;
    const rookTo = kingSide ? m.from + 1 : m.from - 1;
    board[rookFrom] = board[rookTo];
    board[rookTo] = null;
  }
  pos.castling = u.castling;
  pos.ep = u.ep;
  pos.halfmove = u.halfmove;
}

export function legalMoves(pos: Position): IMove[] {
  const us = pos.turn;
  const out: IMove[] = [];
  for (const m of pseudoMoves(pos)) {
    const u = makeMove(pos, m);
    if (!inCheck(pos, us)) out.push(m);
    unmakeMove(pos, u);
  }
  return out;
}

export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  const moves = legalMoves(pos);
  if (depth === 1) return moves.length;
  let n = 0;
  for (const m of moves) {
    const u = makeMove(pos, m);
    n += perft(pos, depth - 1);
    unmakeMove(pos, u);
  }
  return n;
}

