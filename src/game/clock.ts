// 用时：每一步花了多少毫秒（和着法一一对应），加上当前这一手的实时计时。
import { useCallback, useEffect, useRef } from 'react';
import { GAMES, otherColor, type Color, type GameId } from '../core/types';

// 当前这一手已经用了多久。只在页面可见时计时：锁屏、切后台不算。resetKey 变了就从 0 重新开始。
export function useTurnClock(resetKey: unknown) {
  const acc = useRef(0);
  const since = useRef<number | null>(document.hidden ? null : Date.now());

  useEffect(() => {
    acc.current = 0;
    since.current = document.hidden ? null : Date.now();
  }, [resetKey]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (since.current !== null) acc.current += Date.now() - since.current;
        since.current = null;
      } else if (since.current === null) {
        since.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return useCallback(() => acc.current + (since.current !== null ? Date.now() - since.current : 0), []);
}

// 着法列表变化后，对应的用时数组：多走了一步就记上这一步的耗时，否则（悔棋/重开）截断
export function nextTimes(prevMoves: number, prevTimes: number[], nextMoves: number, elapsed: number): number[] {
  const base = prevTimes.slice(0, Math.min(prevMoves, nextMoves));
  while (base.length < Math.min(prevMoves, nextMoves)) base.push(0);
  if (nextMoves === prevMoves + 1) base.push(Math.max(0, Math.round(elapsed)));
  return base.slice(0, nextMoves);
}

export function totalsBySide(game: GameId, times: number[]): Record<Color, number> {
  const first = GAMES[game].firstSide;
  const out: Record<Color, number> = { white: 0, black: 0 };
  times.forEach((t, i) => {
    out[i % 2 === 0 ? first : otherColor(first)] += t;
  });
  return out;
}

export function formatClock(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
