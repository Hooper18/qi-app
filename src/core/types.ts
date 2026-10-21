export type GameId = 'xiangqi' | 'chess' | 'gomoku';
export type Mode = 'ai' | 'local' | 'online';
export type Level = 1 | 2 | 3;
// 三种棋统一用 chessground 的颜色名：象棋红方 = white，五子棋黑方 = black
export type Color = 'white' | 'black';

export type GameStatus =
  | { kind: 'playing' }
  | { kind: 'win'; winner: Color; reason: string }
  | { kind: 'draw'; reason: string };

export const otherColor = (c: Color): Color => (c === 'white' ? 'black' : 'white');

export interface GameMeta {
  id: GameId;
  name: string;
  firstSide: Color; // 先走的一方
  sideName: Record<Color, string>;
}

export const GAMES: Record<GameId, GameMeta> = {
  xiangqi: { id: 'xiangqi', name: '中国象棋', firstSide: 'white', sideName: { white: '红方', black: '黑方' } },
  chess: { id: 'chess', name: '国际象棋', firstSide: 'white', sideName: { white: '白方', black: '黑方' } },
  gomoku: { id: 'gomoku', name: '五子棋', firstSide: 'black', sideName: { black: '黑方', white: '白方' } },
};

export const LEVEL_NAME: Record<Level, string> = { 1: '简单', 2: '普通', 3: '困难' };
