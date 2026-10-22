import { describe, expect, it } from 'vitest';
import { aiReaction } from './aiReact';

const base = { mover: 'black' as const, aiSide: 'black' as const, captured: null, check: false, status: { kind: 'playing' as const } };

describe('电脑表情反应', () => {
  it('普通一步不发表情', () => {
    expect(aiReaction(base, () => 0)).toBeNull();
  });
  it('电脑吃了大子会得意', () => {
    expect(['1f602', '1f60e', 'p7']).toContain(aiReaction({ ...base, captured: 'r' }, () => 0));
  });
  it('被吃了大子会难过', () => {
    expect(['1f62d', '1f631', '1f97a', 'p3']).toContain(aiReaction({ ...base, mover: 'white', captured: 'q' }, () => 0));
  });
  it('随机数大时不发，避免刷屏', () => {
    expect(aiReaction({ ...base, captured: 'p' }, () => 0.9)).toBeNull();
  });
  it('电脑输了会鼓掌或哭', () => {
    expect(['1f44f', '1f62d', 'p6']).toContain(aiReaction({ ...base, mover: 'white', status: { kind: 'win', winner: 'white', reason: '将死' } }, () => 0));
  });
});
