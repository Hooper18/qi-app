import { describe, expect, it } from 'vitest';
import { replayGomoku, SIZE } from './rules';

const at = (r: number, c: number) => ({ at: r * SIZE + c });

describe('五子棋', () => {
  it('横向五连获胜并给出连线', () => {
    const moves = [at(7, 3), at(8, 3), at(7, 4), at(8, 4), at(7, 5), at(8, 5), at(7, 6), at(8, 6), at(7, 7)];
    const s = replayGomoku(moves);
    expect(s.status).toEqual({ kind: 'win', winner: 'black', reason: '五子连珠' });
    expect(s.winLine).toEqual([at(7, 3).at, at(7, 4).at, at(7, 5).at, at(7, 6).at, at(7, 7).at]);
  });
  it('斜向（反斜）五连', () => {
    const moves = [at(0, 4), at(9, 9), at(1, 3), at(9, 10), at(2, 2), at(9, 11), at(3, 1), at(9, 12), at(4, 0)];
    expect(replayGomoku(moves).status.kind).toBe('win');
  });
  it('四连不算赢，轮到白方', () => {
    const s = replayGomoku([at(7, 3), at(0, 0), at(7, 4), at(0, 1), at(7, 5), at(0, 2), at(7, 6)]);
    expect(s.status.kind).toBe('playing');
    expect(s.turn).toBe('white');
  });
  it('重复落子被忽略', () => {
    const s = replayGomoku([at(7, 7), at(7, 7)]);
    expect(s.count).toBe(1);
  });
});
