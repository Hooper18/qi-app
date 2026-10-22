// 人机 / 同屏模式的对局状态：着法列表 + 本地存档。
import { useCallback, useEffect, useState } from 'react';
import { load, remove, save } from '../core/storage';
import type { Color, GameId, Level, Mode } from '../core/types';
import { nextTimes } from './clock';

export interface LocalSave {
  moves: string[];
  humanSide: Color; // 人机模式里人执哪方；同屏模式无意义
  level: Level;
  times?: number[]; // 每一步用了多少毫秒，和 moves 一一对应（旧存档没有）
  updatedAt: number;
}

export const saveKey = (game: GameId, mode: Mode) => `game:${game}:${mode}`;

export function loadSave(game: GameId, mode: Mode): LocalSave | null {
  return load<LocalSave | null>(saveKey(game, mode), null);
}

export function useLocalMatch(game: GameId, mode: 'ai' | 'local', init: { humanSide: Color; level: Level; resume: boolean }) {
  const [state, setState] = useState<LocalSave>(() => {
    const saved = init.resume ? loadSave(game, mode) : null;
    return saved ?? { moves: [], humanSide: init.humanSide, level: init.level, updatedAt: Date.now() };
  });

  useEffect(() => {
    if (state.moves.length === 0) remove(saveKey(game, mode));
    else save(saveKey(game, mode), state);
  }, [game, mode, state]);

  // elapsed：新走的这一步用了多久（悔棋/重开时忽略）
  const setMoves = useCallback(
    (moves: string[], elapsed = 0) =>
      setState((s) => ({
        ...s,
        moves,
        times: nextTimes(s.moves.length, s.times ?? [], moves.length, elapsed),
        updatedAt: Date.now(),
      })),
    [],
  );
  const restart = useCallback(
    (swapSides: boolean) =>
      setState((s) => ({
        ...s,
        moves: [],
        times: [],
        humanSide: swapSides ? (s.humanSide === 'white' ? 'black' : 'white') : s.humanSide,
        updatedAt: Date.now(),
      })),
    [],
  );
  return { state, setMoves, restart };
}
