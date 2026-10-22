import type { ReactNode } from 'react';
import type { Color, GameId } from '../core/types';
import { IconSmile } from './icons';

// 被吃掉的子用文字显示：象棋用汉字，国际象棋用棋子符号（加 FE0E 强制文本样式，避免安卓显示成 emoji）
const XQ_CHAR: Record<Color, Record<string, string>> = {
  white: { k: '帥', a: '仕', b: '相', n: '傌', r: '俥', c: '炮', p: '兵' },
  black: { k: '將', a: '士', b: '象', n: '馬', r: '車', c: '砲', p: '卒' },
};
const CHESS_CHAR: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
const ORDER = 'qrbncakp';

export interface Seat {
  side: Color;
  name: string;
  status?: string; // 思考中 / 离线 等
}

export function PlayerBar({
  game,
  seat,
  active,
  captured,
  time,
  flipped,
  onEmote,
  bubble,
}: {
  game: GameId;
  seat: Seat;
  active: boolean;
  captured: string[];
  time: string;
  flipped?: boolean;
  onEmote?: () => void; // 有这个就显示表情按钮（这一方可以从本机发表情）
  bubble?: ReactNode;
}) {
  const opp: Color = seat.side === 'white' ? 'black' : 'white';
  const sorted = [...captured].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  return (
    <div className={`player-bar${active ? ' active' : ''}${flipped ? ' flipped' : ''}`}>
      <span className={`side-dot ${game} ${seat.side}`} aria-hidden />
      <div className="player-main">
        <span className="player-name">{seat.name}</span>
        {seat.status && <span className="player-status">{seat.status}</span>}
      </div>
      {sorted.length > 0 && (
        <div className={`captured ${game} ${opp}`} aria-label="吃掉的子">
          {sorted.map((t, i) => (
            <span key={i}>{game === 'xiangqi' ? XQ_CHAR[opp][t] : CHESS_CHAR[t] + '︎'}</span>
          ))}
        </div>
      )}
      <span className="player-time" aria-label="总用时">
        {time}
      </span>
      {onEmote && (
        <button className="emote-btn" onClick={onEmote} aria-label="发表情">
          <IconSmile />
        </button>
      )}
      {bubble}
    </div>
  );
}
