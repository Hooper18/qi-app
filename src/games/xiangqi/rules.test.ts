import { describe, expect, it } from 'vitest';
import { fromXFEN, initialXPosition, xLegalMoves, xPerft } from './rules';
import { replayXiangqi } from './game';

const sq = (r: number, c: number) => r * 9 + c;
const mv = (r1: number, c1: number, r2: number, c2: number) => ({ from: sq(r1, c1), to: sq(r2, c2) });

describe('中国象棋着法生成（perft 标准节点数）', () => {
  it('初始局面', () => {
    const p = initialXPosition();
    expect(xPerft(p, 1)).toBe(44);
    expect(xPerft(p, 2)).toBe(1920);
    expect(xPerft(p, 3)).toBe(79666);
    expect(xPerft(p, 4)).toBe(3290240);
  });
});

describe('中国象棋特殊规则', () => {
  it('将帅不能照面：中间唯一的子不能横走', () => {
    const p = fromXFEN('4k4/9/9/9/9/4C4/9/9/9/4K4 r');
    const moves = xLegalMoves(p);
    expect(moves).toHaveLength(10);
    expect(moves.every((m) => m.from !== sq(5, 4) || m.to % 9 === 4)).toBe(true);
  });
  it('蹩马腿、塞象眼', () => {
    // 红马在 (9,1)，马腿 (8,1) 被堵；红相在 (9,2)，象眼 (8,1)、(8,3) 被堵
    const p = fromXFEN('4k4/9/9/9/9/9/9/9/1P1P5/1NB1K4 r');
    const moves = xLegalMoves(p);
    const horse = moves.filter((m) => m.from === sq(9, 1));
    expect(horse).toHaveLength(0); // 上方马腿被兵堵，右侧马腿被相堵
    expect(moves.filter((m) => m.from === sq(9, 2))).toHaveLength(0);
  });
  it('炮隔一子才能吃', () => {
    const p = fromXFEN('3k5/9/9/9/9/9/4c4/9/4p4/3CK4 r');
    const cannon = xLegalMoves(p).filter((m) => m.from === sq(9, 3));
    expect(cannon.some((m) => m.to === sq(0, 3))).toBe(false); // 中间没有炮架
  });
  it('困毙判负', () => {
    const s = replayXiangqi([], fromXFEN('3k5/8R/9/9/9/9/9/9/9/4K4 b'));
    expect(s.status).toEqual({ kind: 'win', winner: 'r', reason: '困毙' });
  });
  it('绝杀', () => {
    // 铁门栓式：车在底线将军，黑将无处可去
    const s = replayXiangqi([mv(1, 0, 0, 0)], fromXFEN('3k5/R8/3P5/9/9/9/9/9/9/4K4 r'));
    expect(s.status.kind).toBe('win');
  });
  it('长将判负', () => {
    const start = fromXFEN('4k4/8R/9/9/9/9/9/9/9/3K5 r');
    const cycle = [mv(0, 8, 1, 8), mv(1, 4, 0, 4), mv(1, 8, 0, 8), mv(0, 4, 1, 4)];
    const moves = [mv(1, 8, 0, 8), mv(0, 4, 1, 4), ...cycle, ...cycle];
    const s = replayXiangqi(moves, start);
    expect(s.status).toEqual({ kind: 'win', winner: 'b', reason: '长将判负' });
  });
  it('双方无进攻子力判和', () => {
    const s = replayXiangqi([], fromXFEN('3ak4/9/9/9/9/9/9/9/9/4KA3 r'));
    expect(s.status).toEqual({ kind: 'draw', reason: '双方均无进攻子力' });
  });
});

describe('中国象棋适配层', () => {
  it('坐标换算与初始 FEN', async () => {
    const { replayXiangqiView, sqToKey, keyToSq } = await import('./adapter');
    expect(sqToKey(0)).toBe('a:');
    expect(sqToKey(89)).toBe('i1');
    expect(keyToSq('e1')).toBe(85);
    const v = replayXiangqiView([]);
    expect(v.fen).toBe('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR');
    expect(v.turn).toBe('white');
    expect([...v.dests.values()].reduce((n, l) => n + l.length, 0)).toBe(44);
  });
  it('炮二平五后轮到黑方，非法着法被截断', async () => {
    const { replayXiangqiView } = await import('./adapter');
    const v = replayXiangqiView([`${sq(7, 7)}-${sq(7, 4)}`, `${sq(0, 0)}-${sq(5, 5)}`]);
    expect(v.turn).toBe('black');
    expect(v.moveCount).toBe(1);
    expect(v.lastMove).toEqual(['h3', 'e3']);
  });
});
