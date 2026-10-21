import { describe, expect, it } from 'vitest';
import { fromFEN, initialPosition, perft, sqFromName, toFEN } from './rules';
import { replayChess } from './game';

const mv = (s: string) => ({ from: sqFromName(s.slice(0, 2)), to: sqFromName(s.slice(2, 4)), promo: (s[4] as 'q') || undefined });

describe('国际象棋着法生成（perft 标准节点数）', () => {
  it('初始局面', () => {
    const p = initialPosition();
    expect(perft(p, 1)).toBe(20);
    expect(perft(p, 2)).toBe(400);
    expect(perft(p, 3)).toBe(8902);
    expect(perft(p, 4)).toBe(197281);
    expect(toFEN(p)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });
  it('Kiwipete（易位/过路兵/升变密集）', () => {
    const p = fromFEN('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
    expect(perft(p, 1)).toBe(48);
    expect(perft(p, 2)).toBe(2039);
    expect(perft(p, 3)).toBe(97862);
  });
  it('position 3（残局过路兵牵制）', () => {
    const p = fromFEN('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
    expect(perft(p, 4)).toBe(43238);
  });
  it('position 4（升变 + 易位）', () => {
    const p = fromFEN('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1');
    expect(perft(p, 3)).toBe(9467);
  });
  it('position 5', () => {
    const p = fromFEN('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8');
    expect(perft(p, 3)).toBe(62379);
  });
});

describe('国际象棋胜负判定', () => {
  it('愚者将杀', () => {
    const s = replayChess(['f2f3', 'e7e5', 'g2g4', 'd8h4'].map(mv));
    expect(s.status).toEqual({ kind: 'win', winner: 'b', reason: '将死' });
    expect(s.checkSq).toBe(sqFromName('e1'));
  });
  it('三次重复局面判和', () => {
    const cycle = ['g1f3', 'g8f6', 'f3g1', 'f6g8'];
    const s = replayChess([...cycle, ...cycle].map(mv));
    expect(s.status).toEqual({ kind: 'draw', reason: '三次重复局面' });
  });
  it('吃子记录', () => {
    const s = replayChess(['e2e4', 'd7d5', 'e4d5'].map(mv));
    expect(s.captured.w).toEqual(['p']);
  });
  it('非法着法被忽略', () => {
    const s = replayChess(['e2e5'].map(mv));
    expect(s.lastMove).toBeNull();
  });
});
