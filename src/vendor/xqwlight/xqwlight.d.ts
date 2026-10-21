export class Position {
  sdPlayer: number;
  fromFen(fen: string): void;
  makeMove(mv: number): boolean;
  generateMoves(vls: number[] | null): number[];
  legalMove(mv: number): boolean;
}
export class Search {
  constructor(pos: Position, hashLevel: number);
  searchMain(depth: number, millis: number): number;
}
export function SRC(mv: number): number;
export function DST(mv: number): number;
export function MOVE(src: number, dst: number): number;
export function COORD_XY(x: number, y: number): number;
export function RANK_Y(sq: number): number;
export function FILE_X(sq: number): number;
export const LIMIT_DEPTH: number;
