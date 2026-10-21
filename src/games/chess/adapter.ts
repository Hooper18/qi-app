// 国际象棋：规则全部交给 chess.js，这里只把它的结果转成棋盘组件要的形状。
// 着法用 UCI 字符串存（e2e4、e7e8q）。
import { Chess, type Square } from 'chess.js';
import type { Key } from 'chessgroundx/types';
import type { Color, GameStatus } from '../../core/types';

export interface ChessView {
  fen: string;
  turn: Color;
  dests: Map<Key, Key[]>;
  lastMove?: [Key, Key];
  check: boolean;
  status: GameStatus;
  captured: Record<Color, string[]>; // 某方吃掉的子（小写字母）
  promotions: Set<string>; // 需要选升变的 "from+to"
  moveCount: number;
}

const toColor = (c: 'w' | 'b'): Color => (c === 'w' ? 'white' : 'black');

export function replayChess(moves: string[]): ChessView {
  const game = new Chess();
  let applied = 0;
  for (const m of moves) {
    try {
      game.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
      applied++;
    } catch {
      break; // 数据损坏就停在最后一步合法的位置
    }
  }
  const dests = new Map<Key, Key[]>();
  const promotions = new Set<string>();
  for (const mv of game.moves({ verbose: true })) {
    const list = dests.get(mv.from as Key) ?? [];
    if (!list.includes(mv.to as Key)) list.push(mv.to as Key);
    dests.set(mv.from as Key, list);
    if (mv.promotion) promotions.add(mv.from + mv.to);
  }
  const captured: Record<Color, string[]> = { white: [], black: [] };
  const history = game.history({ verbose: true });
  for (const h of history) if (h.captured) captured[toColor(h.color)].push(h.captured);
  const last = history[history.length - 1];
  const turn = toColor(game.turn());
  return {
    fen: game.fen(),
    turn,
    dests,
    lastMove: last ? [last.from as Key, last.to as Key] : undefined,
    check: game.inCheck(),
    status: chessStatus(game, turn),
    captured,
    promotions,
    moveCount: applied,
  };
}

function chessStatus(game: Chess, turn: Color): GameStatus {
  if (game.isCheckmate()) return { kind: 'win', winner: turn === 'white' ? 'black' : 'white', reason: '将死' };
  if (game.isStalemate()) return { kind: 'draw', reason: '逼和' };
  if (game.isInsufficientMaterial()) return { kind: 'draw', reason: '子力不足' };
  if (game.isThreefoldRepetition()) return { kind: 'draw', reason: '三次重复局面' };
  if (game.isDrawByFiftyMoves()) return { kind: 'draw', reason: '50 回合无吃子无动兵' };
  return { kind: 'playing' };
}

export const isSquare = (k: string): k is Square => /^[a-h][1-8]$/.test(k);
