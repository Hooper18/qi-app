import { useCallback, useSyncExternalStore } from 'react';
import { load, save } from './storage';

export interface Settings {
  sound: boolean;
  vibrate: boolean;
  confirm: boolean; // 落子二次确认
  face: boolean; // 同屏对坐：上方棋子倒过来
  muteEmotes: boolean; // 屏蔽对方（含电脑）发来的表情
  speakPhrases: boolean; // 快捷语用语音读出来
}

const DEFAULTS: Settings = { sound: true, vibrate: true, confirm: true, face: false, muteEmotes: false, speakPhrases: true };
let current: Settings = { ...DEFAULTS, ...load<Partial<Settings>>('settings', {}) };
const listeners = new Set<() => void>();

export const getSettings = () => current;

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const value = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
  const update = useCallback((patch: Partial<Settings>) => {
    current = { ...current, ...patch };
    save('settings', current);
    listeners.forEach((l) => l());
  }, []);
  return [value, update];
}
