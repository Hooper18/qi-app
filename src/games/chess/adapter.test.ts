import { describe, expect, it } from 'vitest';
import { replayChess } from './adapter';

describe('国际象棋适配层（chess.js）', () => {
  it('初始局面 20 种走法，白先', () => {
    const v = replayChess([]);
    expect(v.turn).toBe('white');
    expect([...v.dests.values()].reduce((n, l) => n + l.length, 0)).toBe(20);
  });
  it('愚者将杀', () => {
    const v = replayChess(['f2f3', 'e7e5', 'g2g4', 'd8h4']);
    expect(v.status).toEqual({ kind: 'win', winner: 'black', reason: '将死' });
    expect(v.check).toBe(true);
    expect(v.lastMove).toEqual(['d8', 'h4']);
  });
  it('升变着法被标记', () => {
    const v = replayChess(['a2a4', 'b7b5', 'a4b5', 'a7a6', 'b5a6', 'c8b7', 'a6a7', 'e7e6']);
    expect(v.promotions.has('a7a8')).toBe(false); // a8 有黑车挡着
    expect(v.promotions.has('a7b8')).toBe(true);
  });
  it('吃子记录与非法着法截断', () => {
    const v = replayChess(['e2e4', 'd7d5', 'e4d5', 'e7e1']);
    expect(v.captured.white).toEqual(['p']);
    expect(v.moveCount).toBe(3);
  });
});
