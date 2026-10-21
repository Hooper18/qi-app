// 五子棋棋盘：SVG 自绘。第一下出半透明预览子，第二下点同一点才落子（可在设置里关掉确认）。
import { useEffect, useRef, useState } from 'react';
import type { Color } from '../core/types';
import { SIZE } from '../games/gomoku/rules';

interface Props {
  board: (Color | null)[];
  turn: Color;
  lastMove: number | null;
  winLine: number[] | null;
  interactive: boolean;
  confirm: boolean;
  onPlace: (at: number) => void;
  onPendingChange?: (pending: boolean) => void;
  onOccupied?: () => void;
}

const CELL = 40;
const PAD = 26;
const SPAN = CELL * (SIZE - 1);
const VIEW = SPAN + PAD * 2;
const STARS = [
  [3, 3],
  [3, 11],
  [7, 7],
  [11, 3],
  [11, 11],
];
const pos = (i: number) => PAD + i * CELL;

export function GomokuBoard({ board, turn, lastMove, winLine, interactive, confirm, onPlace, onPendingChange, onOccupied }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [pending, setPendingState] = useState<number | null>(null);

  const setPending = (v: number | null) => {
    setPendingState(v);
    onPendingChange?.(v !== null);
  };

  // 局面变了（对方落子、悔棋）就清掉预览
  useEffect(() => {
    setPendingState(null);
    onPendingChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, interactive]);

  const handleUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive || !svg.current) return;
    const rect = svg.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VIEW;
    const y = ((e.clientY - rect.top) / rect.height) * VIEW;
    const c = Math.round((x - PAD) / CELL);
    const r = Math.round((y - PAD) / CELL);
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    const at = r * SIZE + c;
    if (board[at]) {
      setPending(null);
      onOccupied?.();
      return;
    }
    if (!confirm || pending === at) {
      setPending(null);
      onPlace(at);
    } else {
      setPending(at);
    }
  };

  const winSet = new Set(winLine ?? []);
  const line = winLine && winLine.length >= 2 ? [winLine[0], winLine[winLine.length - 1]] : null;

  return (
    <div className="board-frame gomoku">
      <svg
        ref={svg}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className={`gomoku-svg${interactive ? ' interactive' : ''}`}
        onPointerUp={handleUp}
        role="grid"
        aria-label="五子棋棋盘"
      >
        <defs>
          <radialGradient id="stone-black" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#5b5b5b" />
            <stop offset="45%" stopColor="#1e1e1e" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
          <radialGradient id="stone-white" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#eceae4" />
            <stop offset="100%" stopColor="#c9c5bb" />
          </radialGradient>
          <filter id="stone-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0.8" dy="1.6" stdDeviation="1.2" floodColor="#3a2a10" floodOpacity="0.35" />
          </filter>
        </defs>
        <rect x="0" y="0" width={VIEW} height={VIEW} rx="8" className="gomoku-wood" />
        <g className="gomoku-grid">
          {Array.from({ length: SIZE }, (_, i) => (
            <g key={i}>
              <line x1={pos(0)} y1={pos(i)} x2={pos(SIZE - 1)} y2={pos(i)} />
              <line x1={pos(i)} y1={pos(0)} x2={pos(i)} y2={pos(SIZE - 1)} />
            </g>
          ))}
          <rect x={pos(0)} y={pos(0)} width={SPAN} height={SPAN} className="gomoku-border" />
          {STARS.map(([r, c]) => (
            <circle key={`${r}-${c}`} cx={pos(c)} cy={pos(r)} r="4" className="gomoku-star" />
          ))}
        </g>
        {board.map((s, at) =>
          s ? (
            <g key={at} className="stone-drop" style={{ transformOrigin: `${pos(at % SIZE)}px ${pos(Math.floor(at / SIZE))}px` }}>
              <circle
                cx={pos(at % SIZE)}
                cy={pos(Math.floor(at / SIZE))}
                r={CELL * 0.45}
                fill={`url(#stone-${s})`}
                filter="url(#stone-shadow)"
                className={winSet.has(at) ? 'stone win' : 'stone'}
              />
            </g>
          ) : null,
        )}
        {lastMove !== null && board[lastMove] && !winLine && (
          <circle
            cx={pos(lastMove % SIZE)}
            cy={pos(Math.floor(lastMove / SIZE))}
            r="4.5"
            className={board[lastMove] === 'black' ? 'last-dot on-black' : 'last-dot on-white'}
          />
        )}
        {line && (
          <line
            x1={pos(line[0] % SIZE)}
            y1={pos(Math.floor(line[0] / SIZE))}
            x2={pos(line[1] % SIZE)}
            y2={pos(Math.floor(line[1] / SIZE))}
            className="win-line"
            pathLength={1}
          />
        )}
        {pending !== null && (
          <circle
            cx={pos(pending % SIZE)}
            cy={pos(Math.floor(pending / SIZE))}
            r={CELL * 0.45}
            fill={`url(#stone-${turn})`}
            className="stone pending"
          />
        )}
      </svg>
    </div>
  );
}
