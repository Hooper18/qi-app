import { describe, expect, it } from 'vitest';
import { formatClock, nextTimes, totalsBySide } from './clock';

describe('用时', () => {
  it('走一步记一次耗时，悔棋截断', () => {
    expect(nextTimes(0, [], 1, 1234.4)).toEqual([1234]);
    expect(nextTimes(3, [1, 2, 3], 4, 10)).toEqual([1, 2, 3, 10]);
    expect(nextTimes(4, [1, 2, 3, 4], 2, 99)).toEqual([1, 2]);
    expect(nextTimes(4, [1, 2, 3, 4], 0, 99)).toEqual([]);
  });
  it('旧存档没有用时数组也能补齐', () => {
    expect(nextTimes(3, [], 4, 5)).toEqual([0, 0, 0, 5]);
  });
  it('按先后手分到双方', () => {
    expect(totalsBySide('xiangqi', [1000, 2000, 3000])).toEqual({ white: 4000, black: 2000 });
    expect(totalsBySide('gomoku', [1000, 2000, 3000])).toEqual({ black: 4000, white: 2000 });
  });
  it('格式化', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65_400)).toBe('1:05');
    expect(formatClock(3_725_000)).toBe('1:02:05');
  });
});
