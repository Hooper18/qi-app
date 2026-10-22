// 电脑对手的"情绪"：根据刚发生的事随机挑一个表情（不是每次都发，免得刷屏）
import type { Color, GameStatus } from '../core/types';

export interface MoveEvent {
  mover: Color; // 刚走完这一步的一方
  aiSide: Color;
  captured: string | null; // 这一步吃掉的子（小写字母），没吃为 null
  check: boolean; // 这一步走完是否将军
  status: GameStatus;
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export function aiReaction(e: MoveEvent, rand: () => number = Math.random): string | null {
  const aiMoved = e.mover === e.aiSide;
  if (e.status.kind === 'win') {
    if (rand() > 0.8) return null;
    return e.status.winner === e.aiSide ? pick(['1f602', '1f60e', '1f389']) : pick(['1f44f', '1f62d', 'p6']);
  }
  if (e.status.kind === 'draw') return rand() < 0.6 ? pick(['1f914', 'p8']) : null;
  if (e.captured) {
    const big = e.captured !== 'p';
    if (rand() > (big ? 0.6 : 0.25)) return null;
    return aiMoved ? pick(['1f602', '1f60e', 'p7']) : pick(['1f62d', '1f631', '1f97a', 'p3']);
  }
  if (e.check && aiMoved) return rand() < 0.5 ? pick(['1f60e', 'p5']) : null;
  return null;
}

// 轮到人走、想了太久时电脑催一下
export const IDLE_NUDGE_MS = 45_000;
export const idleNudge = () => pick(['1f422', '1f634', 'p1']);
