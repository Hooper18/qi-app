// 中国象棋规则：可变棋盘 + make/unmake，界面和电脑搜索共用。
// 格子编号 sq = r * 9 + c，r = 0 是黑方底线，r = 9 是红方底线。红方先走。

export type Side = 'r' | 'b';
export type XType = 'k' | 'a' | 'b' | 'n' | 'r' | 'c' | 'p';
export interface XPiece {
  s: Side;
  t: XType;
  id: number;
}
export interface XMove {
  from: number;
  to: number;
}
export interface XPosition {
  board: (XPiece | null)[];
  turn: Side;
  quiet: number; // 连续未吃子的步数
}
export interface XUndo {
  move: XMove;
  captured: XPiece | null;
  quiet: number;
}

export const ROWS = 10;
export const COLS = 9;
export const otherSide = (s: Side): Side => (s === 'r' ? 'b' : 'r');
export const rowOf = (sq: number) => Math.floor(sq / 9);
export const colOf = (sq: number) => sq % 9;
const at = (r: number, c: number) => r * 9 + c;
const inBoard = (r: number, c: number) => r >= 0 && r < 10 && c >= 0 && c < 9;
const inPalace = (s: Side, r: number, c: number) => c >= 3 && c <= 5 && (s === 'r' ? r >= 7 && r <= 9 : r >= 0 && r <= 2);
const ownHalf = (s: Side, r: number) => (s === 'r' ? r >= 5 : r <= 4);
const forward = (s: Side) => (s === 'r' ? -1 : 1);

const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

const START_ROWS: Record<number, string> = {
  0: 'rnbakabnr',
  2: '.c.....c.',
  3: 'p.p.p.p.p',
};

export function initialXPosition(): XPosition {
  const board: (XPiece | null)[] = new Array(90).fill(null);
  let id = 1;
  for (const [rowStr, line] of Object.entries(START_ROWS)) {
    const r = Number(rowStr);
    for (let c = 0; c < 9; c++) {
      const ch = line[c];
      if (ch === '.') continue;
      board[at(r, c)] = { s: 'b', t: ch as XType, id: id++ };
      board[at(9 - r, c)] = { s: 'r', t: ch as XType, id: id++ };
    }
  }
  return { board, turn: 'r', quiet: 0 };
}

// 简化 FEN：只描述棋盘（大写红方，小写黑方）+ 走子方，测试和调试用
export function fromXFEN(fen: string): XPosition {
  const [placement, turn] = fen.trim().split(/\s+/);
  const board: (XPiece | null)[] = new Array(90).fill(null);
  let sq = 0;
  let id = 1;
  for (const ch of placement) {
    if (ch === '/') continue;
    if (/\d/.test(ch)) {
      sq += Number(ch);
      continue;
    }
    const lower = ch.toLowerCase();
    const t = (lower === 'h' ? 'n' : lower === 'e' ? 'b' : lower) as XType;
    board[sq++] = { s: ch === lower ? 'b' : 'r', t, id: id++ };
  }
  return { board, turn: turn === 'b' ? 'b' : 'r', quiet: 0 };
}

export function cloneX(pos: XPosition): XPosition {
  return { ...pos, board: pos.board.slice() };
}

export function findGeneral(board: (XPiece | null)[], s: Side): number {
  const rows = s === 'r' ? [7, 8, 9] : [0, 1, 2];
  for (const r of rows) {
    for (let c = 3; c <= 5; c++) {
      const p = board[at(r, c)];
      if (p && p.t === 'k' && p.s === s) return at(r, c);
    }
  }
  return -1;
}

// 判断 sq 是否被 by 方攻击。将帅照面也算作攻击，这样"不能照面"就自动包含在将军检测里。
// 仕、相永远够不到对方九宫，这里不检测它们。
export function attackedBy(board: (XPiece | null)[], sq: number, by: Side): boolean {
  const r = rowOf(sq);
  const c = colOf(sq);
  for (const [dr, dc] of ORTH) {
    let rr = r + dr;
    let cc = c + dc;
    let screens = 0;
    while (inBoard(rr, cc)) {
      const p = board[at(rr, cc)];
      if (p) {
        if (screens === 0) {
          if (p.s === by && (p.t === 'r' || (p.t === 'k' && dc === 0))) return true;
          screens = 1;
        } else {
          if (p.s === by && p.t === 'c') return true;
          break;
        }
      }
      rr += dr;
      cc += dc;
    }
  }
  // 马：攻击方马在 sq - off，马腿在马旁边靠"走两格"的那个方向
  for (const [dr, dc] of [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]]) {
    const nr = r - dr;
    const nc = c - dc;
    if (!inBoard(nr, nc)) continue;
    const p = board[at(nr, nc)];
    if (!p || p.s !== by || p.t !== 'n') continue;
    const legR = nr + (Math.abs(dr) === 2 ? Math.sign(dr) : 0);
    const legC = nc + (Math.abs(dc) === 2 ? Math.sign(dc) : 0);
    if (!board[at(legR, legC)]) return true;
  }
  // 兵：从后方一格，或过河后从左右一格
  const back = r - forward(by);
  if (inBoard(back, c)) {
    const p = board[at(back, c)];
    if (p && p.s === by && p.t === 'p') return true;
  }
  if (!ownHalf(by, r)) {
    for (const dc of [-1, 1]) {
      if (!inBoard(r, c + dc)) continue;
      const p = board[at(r, c + dc)];
      if (p && p.s === by && p.t === 'p') return true;
    }
  }
  // 帅贴身
  for (const [dr, dc] of ORTH) {
    if (!inBoard(r + dr, c + dc)) continue;
    const p = board[at(r + dr, c + dc)];
    if (p && p.s === by && p.t === 'k') return true;
  }
  return false;
}

export function xInCheck(pos: XPosition, s: Side = pos.turn): boolean {
  const g = findGeneral(pos.board, s);
  return g >= 0 && attackedBy(pos.board, g, otherSide(s));
}

export function xPseudoMoves(pos: XPosition, capturesOnly = false): XMove[] {
  const list: XMove[] = [];
  const { board, turn } = pos;
  const add = (from: number, r: number, c: number) => {
    const t = board[at(r, c)];
    if (t ? t.s !== turn : !capturesOnly) list.push({ from, to: at(r, c) });
  };
  for (let sq = 0; sq < 90; sq++) {
    const p = board[sq];
    if (!p || p.s !== turn) continue;
    const r = rowOf(sq);
    const c = colOf(sq);
    switch (p.t) {
      case 'k':
        for (const [dr, dc] of ORTH) if (inPalace(turn, r + dr, c + dc)) add(sq, r + dr, c + dc);
        break;
      case 'a':
        for (const [dr, dc] of DIAG) if (inPalace(turn, r + dr, c + dc)) add(sq, r + dr, c + dc);
        break;
      case 'b':
        for (const [dr, dc] of DIAG) {
          const tr = r + 2 * dr;
          const tc = c + 2 * dc;
          if (inBoard(tr, tc) && ownHalf(turn, tr) && !board[at(r + dr, c + dc)]) add(sq, tr, tc);
        }
        break;
      case 'n':
        for (const [dr, dc] of ORTH) {
          if (!inBoard(r + dr, c + dc) || board[at(r + dr, c + dc)]) continue;
          for (const side of [-1, 1]) {
            const tr = r + 2 * dr + (dr === 0 ? side : 0);
            const tc = c + 2 * dc + (dc === 0 ? side : 0);
            if (inBoard(tr, tc)) add(sq, tr, tc);
          }
        }
        break;
      case 'r':
      case 'c':
        for (const [dr, dc] of ORTH) {
          let rr = r + dr;
          let cc = c + dc;
          let jumped = false;
          while (inBoard(rr, cc)) {
            const t = board[at(rr, cc)];
            if (p.t === 'r') {
              if (t) {
                if (t.s !== turn) list.push({ from: sq, to: at(rr, cc) });
                break;
              }
              if (!capturesOnly) list.push({ from: sq, to: at(rr, cc) });
            } else if (!jumped) {
              if (t) jumped = true;
              else if (!capturesOnly) list.push({ from: sq, to: at(rr, cc) });
            } else if (t) {
              if (t.s !== turn) list.push({ from: sq, to: at(rr, cc) });
              break;
            }
            rr += dr;
            cc += dc;
          }
        }
        break;
      case 'p': {
        const fr = r + forward(turn);
        if (inBoard(fr, c)) add(sq, fr, c);
        if (!ownHalf(turn, r)) {
          if (inBoard(r, c - 1)) add(sq, r, c - 1);
          if (inBoard(r, c + 1)) add(sq, r, c + 1);
        }
        break;
      }
    }
  }
  return list;
}

export function xMake(pos: XPosition, m: XMove): XUndo {
  const u: XUndo = { move: m, captured: pos.board[m.to], quiet: pos.quiet };
  pos.board[m.to] = pos.board[m.from];
  pos.board[m.from] = null;
  pos.quiet = u.captured ? 0 : pos.quiet + 1;
  pos.turn = otherSide(pos.turn);
  return u;
}

export function xUnmake(pos: XPosition, u: XUndo) {
  pos.turn = otherSide(pos.turn);
  pos.board[u.move.from] = pos.board[u.move.to];
  pos.board[u.move.to] = u.captured;
  pos.quiet = u.quiet;
}

export function xLegalMoves(pos: XPosition): XMove[] {
  const us = pos.turn;
  const out: XMove[] = [];
  for (const m of xPseudoMoves(pos)) {
    const u = xMake(pos, m);
    if (!xInCheck(pos, us)) out.push(m);
    xUnmake(pos, u);
  }
  return out;
}

export function xPerft(pos: XPosition, depth: number): number {
  if (depth === 0) return 1;
  const moves = xLegalMoves(pos);
  if (depth === 1) return moves.length;
  let n = 0;
  for (const m of moves) {
    const u = xMake(pos, m);
    n += xPerft(pos, depth - 1);
    xUnmake(pos, u);
  }
  return n;
}

export function xKey(pos: XPosition): string {
  let s = '';
  for (const p of pos.board) s += p ? (p.s === 'r' ? p.t.toUpperCase() : p.t) : '.';
  return s + pos.turn;
}
