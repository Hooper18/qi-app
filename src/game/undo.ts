import { GAMES, type Color, type GameId } from '../core/types';

// 撤销到 side 最近一步之前（人机：撤掉自己和电脑各一步；联机：撤掉请求方那一步及之后）
export function undoFor(game: GameId, moves: string[], side: Color): string[] {
  const first = GAMES[game].firstSide;
  for (let i = moves.length - 1; i >= 0; i--) {
    const mover = i % 2 === 0 ? first : first === 'white' ? 'black' : 'white';
    if (mover === side) return moves.slice(0, i);
  }
  return moves;
}

export const moverOf = (game: GameId, index: number): Color => {
  const first = GAMES[game].firstSide;
  return index % 2 === 0 ? first : first === 'white' ? 'black' : 'white';
};
