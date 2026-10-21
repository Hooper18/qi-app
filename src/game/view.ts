// 把三种棋的"着法列表 → 当前局面"统一成一个入口。
import type { Color, GameId, GameStatus } from '../core/types';
import { type ChessView, replayChess } from '../games/chess/adapter';
import { type GomokuState, replayGomoku } from '../games/gomoku/rules';
import { type XiangqiView, replayXiangqiView, sqToKey } from '../games/xiangqi/adapter';

export type AnyView =
  | { game: 'chess'; v: ChessView }
  | { game: 'xiangqi'; v: XiangqiView }
  | { game: 'gomoku'; v: GomokuState };

export interface Common {
  turn: Color;
  status: GameStatus;
  moveCount: number;
  captures: number;
  check: boolean;
}

export function replay(game: GameId, moves: string[]): AnyView {
  if (game === 'chess') return { game, v: replayChess(moves) };
  if (game === 'xiangqi') return { game, v: replayXiangqiView(moves) };
  return { game, v: replayGomoku(moves.map((m) => ({ at: Number(m) }))) };
}

export function common(view: AnyView): Common {
  if (view.game === 'gomoku') {
    const v = view.v;
    return { turn: v.turn, status: v.status, moveCount: v.count, captures: 0, check: false };
  }
  const v = view.v;
  return {
    turn: v.turn,
    status: v.status,
    moveCount: v.moveCount,
    captures: v.captured.white.length + v.captured.black.length,
    check: v.check,
  };
}

// 着法是否合法（联机收到对方着法、电脑给出着法时校验）
export function isLegal(view: AnyView, move: string): boolean {
  if (common(view).status.kind !== 'playing') return false;
  if (view.game === 'gomoku') {
    const at = Number(move);
    return Number.isInteger(at) && at >= 0 && at < 225 && !view.v.board[at];
  }
  if (view.game === 'chess') {
    const from = move.slice(0, 2);
    const to = move.slice(2, 4);
    return !!view.v.dests.get(from as never)?.includes(to as never);
  }
  const [from, to] = move.split('-').map(Number);
  const keys = replayKeys(from, to);
  return !!keys && !!view.v.dests.get(keys[0])?.includes(keys[1]);
}

function replayKeys(from: number, to: number) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from > 89 || to > 89) return null;
  return [sqToKey(from), sqToKey(to)] as const;
}
