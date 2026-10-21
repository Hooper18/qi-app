import { describe, expect, it } from 'vitest';
import { undoFor } from './undo';

describe('悔棋', () => {
  it('人机：人执红，电脑已应 → 撤两步', () => {
    expect(undoFor('xiangqi', ['a', 'b', 'c', 'd'], 'white')).toEqual(['a', 'b']);
  });
  it('人机：电脑还没应 → 撤一步', () => {
    expect(undoFor('xiangqi', ['a', 'b', 'c'], 'white')).toEqual(['a', 'b']);
  });
  it('五子棋黑先：白方悔棋', () => {
    expect(undoFor('gomoku', ['1', '2', '3'], 'white')).toEqual(['1']);
  });
  it('还没走过就不变', () => {
    expect(undoFor('chess', ['e2e4'], 'black')).toEqual(['e2e4']);
  });
});
