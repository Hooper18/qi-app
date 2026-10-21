// 联机：Supabase Realtime 广播频道。不建表、不登录，两个人进同一个频道互发状态。
// 状态带递增版本号 rev，谁的版本高就以谁为准；每次变化都发全量状态（着法列表很短）。
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import type { Color, GameId } from '../core/types';
import { load, save } from '../core/storage';

export interface RoomState {
  rev: number;
  game: GameId;
  hostSide: Color; // 房主执哪方（每次重开互换先后手）
  moves: string[];
  resigned: Color | null;
}

export type AskKind = 'undo' | 'restart';
export type RoomMsg =
  | { t: 'state'; s: RoomState }
  | { t: 'hello' }
  | { t: 'ask'; kind: AskKind; id: string }
  | { t: 'answer'; kind: AskKind; ok: boolean; id: string };

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const onlineAvailable = Boolean(URL && KEY);

let client: SupabaseClient | null = null;
const sb = () =>
  (client ??= createClient(URL!, KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }));

export function newRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function clientId(): string {
  let id = load<string>('client-id', '');
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    save('client-id', id);
  }
  return id;
}

export type ConnStatus = 'connecting' | 'connected' | 'offline';

export interface RoomHandlers {
  onMsg: (msg: RoomMsg) => void;
  onPeers: (peers: number) => void; // 除自己外在线的人数
  onStatus: (s: ConnStatus) => void;
}

export interface RoomConnection {
  send: (msg: RoomMsg) => void;
  leave: () => void;
}

export function connectRoom(code: string, h: RoomHandlers): RoomConnection {
  const me = clientId();
  const channel: RealtimeChannel = sb().channel(`qi-room-${code}`, {
    config: { broadcast: { self: false }, presence: { key: me } },
  });
  channel
    .on('broadcast', { event: 'm' }, ({ payload }) => h.onMsg(payload as RoomMsg))
    .on('presence', { event: 'sync' }, () => {
      const others = Object.keys(channel.presenceState()).filter((k) => k !== me);
      h.onPeers(others.length);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        h.onStatus('connected');
        void channel.track({ at: Date.now() });
        void channel.send({ type: 'broadcast', event: 'm', payload: { t: 'hello' } satisfies RoomMsg });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        h.onStatus('offline');
      }
    });
  h.onStatus('connecting');
  return {
    send: (msg) => void channel.send({ type: 'broadcast', event: 'm', payload: msg }),
    leave: () => void sb().removeChannel(channel),
  };
}
