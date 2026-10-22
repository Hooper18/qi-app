// 联机房间的状态机：本地存一份房间状态，和对方互发，版本号高的为准。
import { useCallback, useEffect, useRef, useState } from 'react';
import { load, save } from '../core/storage';
import { isKnownEmote } from '../emote/catalog';
import { GAMES, otherColor, type Color, type GameId } from '../core/types';
import { type AskKind, type ConnStatus, type RoomConnection, type RoomMsg, type RoomState, connectRoom } from './room';

interface Stored {
  seat: 'host' | 'guest';
  state: RoomState | null;
}

export interface IncomingAsk {
  kind: AskKind;
  id: string;
}

export function useRoom(code: string, createGame: GameId | null) {
  const [stored, setStored] = useState<Stored>(() => {
    const prev = load<Stored | null>(`room:${code}`, null);
    if (prev) return prev;
    if (createGame) {
      return {
        seat: 'host',
        state: { rev: 1, game: createGame, hostSide: GAMES[createGame].firstSide, moves: [], resigned: null },
      };
    }
    return { seat: 'guest', state: null };
  });
  const [conn, setConn] = useState<ConnStatus>('connecting');
  const [peers, setPeers] = useState(0);
  const [incoming, setIncoming] = useState<IncomingAsk | null>(null);
  const [outgoing, setOutgoing] = useState<AskKind | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [emoteIn, setEmoteIn] = useState<{ side: Color; id: string; key: number } | null>(null);
  const connection = useRef<RoomConnection | null>(null);
  const peersRef = useRef(0);
  const latest = useRef(stored);
  latest.current = stored;

  useEffect(() => save(`room:${code}`, stored), [code, stored]);

  const sendState = useCallback(() => {
    const s = latest.current.state;
    if (s) connection.current?.send({ t: 'state', s });
  }, []);

  const commit = useCallback((next: Omit<RoomState, 'rev'>) => {
    const cur = latest.current;
    const state: RoomState = { ...next, rev: (cur.state?.rev ?? 0) + 1 };
    const updated = { ...cur, state };
    latest.current = updated;
    setStored(updated);
    connection.current?.send({ t: 'state', s: state });
  }, []);

  useEffect(() => {
    const onMsg = (msg: RoomMsg) => {
      const cur = latest.current;
      if (msg.t === 'hello') {
        sendState();
      } else if (msg.t === 'state') {
        if (!cur.state || msg.s.rev > cur.state.rev) {
          const updated = { ...cur, state: msg.s };
          latest.current = updated;
          setStored(updated);
        } else if (msg.s.rev < cur.state.rev) {
          sendState(); // 对方的旧了，把我的发过去
        }
      } else if (msg.t === 'ask') {
        setIncoming({ kind: msg.kind, id: msg.id });
      } else if (msg.t === 'emote') {
        if (isKnownEmote(msg.id) && (msg.side === 'white' || msg.side === 'black')) setEmoteIn({ side: msg.side, id: msg.id, key: Date.now() });
      } else if (msg.t === 'answer') {
        setOutgoing(null);
        setNotice(`对方${msg.ok ? '同意' : '拒绝'}了${msg.kind === 'undo' ? '悔棋' : '重开'}`);
      }
    };
    const c = connectRoom(code, {
      onMsg,
      onPeers: (n) => {
        if (n > peersRef.current) setTimeout(sendState, 50); // 有人进来就把当前局面发给他
        peersRef.current = n;
        setPeers(n);
      },
      onStatus: setConn,
    });
    connection.current = c;
    return () => {
      c.leave();
      connection.current = null;
    };
  }, [code, sendState]);

  const state = stored.state;
  const mySide: Color | null = state ? (stored.seat === 'host' ? state.hostSide : otherColor(state.hostSide)) : null;

  const ask = (kind: AskKind) => {
    setOutgoing(kind);
    connection.current?.send({ t: 'ask', kind, id: Math.random().toString(36).slice(2) });
  };

  const answer = (ok: boolean, apply: () => void) => {
    if (!incoming) return;
    connection.current?.send({ t: 'answer', kind: incoming.kind, ok, id: incoming.id });
    if (ok) apply();
    setIncoming(null);
  };

  const clearNotice = () => setNotice(null);
  const sendEmote = (side: Color, id: string) => connection.current?.send({ t: 'emote', side, id });

  return { state, mySide, seat: stored.seat, conn, peers, commit, ask, answer, incoming, outgoing, notice, clearNotice, emoteIn, sendEmote };
}
