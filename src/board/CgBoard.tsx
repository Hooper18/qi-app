// chessgroundx 的 React 包装 + 两步确认落子。
// 流程：点（或拖）棋子到目标 → 棋子先移过去作为预览，目标格呼吸高亮 → 再点一次目标格才真正落子；
// 预览时点别处：点同一棋子的其他可走点 = 换预览位置；点自己别的棋子 = 改选；点空白 = 取消。
import { useEffect, useRef } from 'react';
import { Chessground } from 'chessgroundx';
import type { Api } from 'chessgroundx/api';
import type { Config } from 'chessgroundx/config';
import type { Key } from 'chessgroundx/types';
import type { Color } from '../core/types';

export interface CgBoardProps {
  variant: 'chess' | 'xiangqi';
  fen: string;
  turn: Color;
  dests: Map<Key, Key[]>;
  lastMove?: [Key, Key];
  check: boolean;
  orientation: Color;
  movable: Color | 'both' | null; // 当前谁能动；null = 只能看
  confirm: boolean;
  face: boolean;
  onMove: (orig: Key, dest: Key) => void;
  onPendingChange?: (pending: boolean) => void;
  onIllegalTap?: (message: string) => void; // 点了不能走的地方 / 没法走的子
}

interface Pending {
  orig: Key;
  dest: Key;
}

export function CgBoard(props: CgBoardProps) {
  const el = useRef<HTMLDivElement>(null);
  const cg = useRef<Api | null>(null);
  const pending = useRef<Pending | null>(null);
  const latest = useRef(props);
  latest.current = props;

  const movableColor = (p: CgBoardProps): Color | 'both' | undefined =>
    p.movable === 'both' ? 'both' : p.movable ?? undefined;

  // 把棋盘恢复成 props 描述的已确认局面
  const sync = () => {
    const p = latest.current;
    pending.current = null;
    p.onPendingChange?.(false);
    cg.current?.set({
      fen: p.fen,
      turnColor: p.turn,
      orientation: p.orientation,
      lastMove: p.lastMove,
      check: p.check ? p.turn : false,
      movable: { color: movableColor(p), dests: p.dests },
      highlight: { custom: new Map() },
    });
    cg.current?.unselect();
  };

  const setPending = (orig: Key, dest: Key) => {
    pending.current = { orig, dest };
    latest.current.onPendingChange?.(true);
    cg.current?.set({
      movable: { color: undefined },
      highlight: {
        custom: new Map([
          [orig, 'pending-from'],
          [dest, 'pending-to'],
        ]),
      },
    });
  };

  useEffect(() => {
    const p = latest.current;
    const config: Config = {
      fen: p.fen,
      orientation: p.orientation,
      turnColor: p.turn,
      lastMove: p.lastMove,
      check: p.check ? p.turn : false,
      coordinates: false,
      dimensions: p.variant === 'xiangqi' ? { width: 9, height: 10 } : { width: 8, height: 8 },
      kingRoles: ['k-piece'],
      animation: { enabled: true, duration: 220 },
      highlight: { lastMove: true, check: true },
      premovable: { enabled: false },
      drawable: { enabled: false },
      draggable: { enabled: true, showGhost: true },
      selectable: { enabled: true },
      movable: {
        free: false,
        color: movableColor(p),
        dests: p.dests,
        showDests: true,
        events: {
          after: (orig, dest) => {
            if (!latest.current.confirm) latest.current.onMove(orig as Key, dest);
            else setPending(orig as Key, dest);
          },
        },
      },
      events: {
        select: (key) => {
          const pend = pending.current;
          if (!pend) return;
          if (key === pend.dest) {
            pending.current = null;
            latest.current.onPendingChange?.(false);
            latest.current.onMove(pend.orig, pend.dest);
            return;
          }
          const alt = latest.current.dests.get(pend.orig);
          sync();
          if (alt?.includes(key)) {
            // 换一个目标位置继续预览
            cg.current?.move(pend.orig, key);
            setPending(pend.orig, key);
          } else if (latest.current.dests.has(key)) {
            cg.current?.selectSquare(key);
          }
        },
      },
    };
    cg.current = Chessground(el.current!, config);
    return () => {
      cg.current?.destroy();
      cg.current = null;
    };
  }, [props.variant]);

  // 已确认局面变化（自己落子、对方落子、悔棋、重开）时同步
  useEffect(() => {
    sync();
  }, [props.fen, props.turn, props.orientation, props.movable, props.dests, props.lastMove, props.check]);

  // 在 chessgroundx 处理点击之前看一眼：选中了子却点到不能走的地方，或者点的子根本没地方走，就给提示
  const checkTap = (e: React.PointerEvent) => {
    const api = cg.current;
    const p = latest.current;
    if (!api || pending.current || !p.movable) return;
    const key = api.getKeyAtDomPos([e.clientX, e.clientY]);
    if (!key) return;
    const mover = p.movable === 'both' ? p.turn : p.movable;
    if (mover !== p.turn) return;
    const piece = api.state.boardState.pieces.get(key);
    const own = piece?.color === mover;
    const sel = api.state.selectable.selected;
    if (typeof sel === 'string' && sel !== key && !own) {
      if (!p.dests.get(sel as Key)?.includes(key)) p.onIllegalTap?.(p.check ? '这里不能走（正被将军）' : '这里不能走');
    } else if (own && !p.dests.get(key)?.length) {
      p.onIllegalTap?.(p.check ? '被将军了，这个子解不了将' : '这个子现在没法走');
    }
  };

  return (
    // 皮肤类名挂在外层：chessgroundx 自己会改内层的 class
    <div className={`board-frame ${props.variant}${props.face ? ' face' : ''}`} onPointerDownCapture={checkTap}>
      <div ref={el} />
    </div>
  );
}
