export type GameId = 'xiangqi' | 'chess' | 'gomoku';
export type Mode = 'ai' | 'local' | 'online';
export type Level = 1 | 2 | 3;

export type GameStatus =
  | { kind: 'playing' }
  | { kind: 'win'; winner: string; reason: string }
  | { kind: 'draw'; reason: string };
