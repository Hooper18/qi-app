// 对局桌面：三种模式共用。上下是双方信息条，中间棋盘，下面一行提示和操作按钮。
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { Key } from 'chessgroundx/types';
import { CgBoard } from '../board/CgBoard';
import { GomokuBoard } from '../board/GomokuBoard';
import { PromotionPicker } from '../board/PromotionPicker';
import { playEndSound, playMoveSound, vibrate } from '../core/feedback';
import { useSettings } from '../core/settings';
import { GAMES, otherColor, type Color, type GameStatus } from '../core/types';
import { keyToSq } from '../games/xiangqi/adapter';
import { formatClock, totalsBySide } from '../game/clock';
import { type AnyView, common } from '../game/view';
import { IconBack, IconSettings } from './icons';
import { PlayerBar, type Seat } from './PlayerBar';
import { back } from './route';
import { SettingsSheet } from './SettingsSheet';

const NO_DESTS = new Map<Key, Key[]>();

export interface GameTableProps {
  view: AnyView;
  title: string;
  status: GameStatus; // 可能被"认输"覆盖，所以由外面给
  canMove: Color | 'both' | null;
  orientation: Color;
  top: Seat;
  bottom: Seat;
  hint: string;
  faceAllowed: boolean;
  onMove: (move: string) => void;
  actions: ReactNode;
  result: ReactNode; // 结束面板里的按钮
  resultTitle: string;
  banner?: ReactNode; // 联机时的房间号/连接状态
  clock: { times: number[]; elapsed: () => number }; // 每步用时 + 当前这手已用时间
}

export function GameTable(p: GameTableProps) {
  const [settings] = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [promo, setPromo] = useState<{ orig: Key; dest: Key } | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [boardReset, setBoardReset] = useState(0);
  // 棋盘中央的大字横幅：将军 / 输赢。key 递增保证同样的字也会重播动画
  const [banner, setBanner] = useState<{ text: string; tone: 'check' | 'win' | 'lose' | 'draw'; key: number } | null>(null);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const showToast = (text: string) => setToast({ text, key: Date.now() });
  const c = common(p.view);
  const game = p.view.game;
  const face = p.faceAllowed && settings.face && game !== 'gomoku';

  // 落子音效 / 震动 / 结束音
  const prev = useRef({ moveCount: c.moveCount, captures: c.captures, finished: p.status.kind !== 'playing' });
  useEffect(() => {
    const before = prev.current;
    const finished = p.status.kind !== 'playing';
    const moved = c.moveCount === before.moveCount + 1;
    if (moved) {
      playMoveSound(game, c.captures > before.captures);
      vibrate(c.captures > before.captures ? 18 : 10);
    }
    if (finished && !before.finished) {
      // 同屏模式总放胜利音；其他模式看下方（自己）是否赢了
      const meWon = p.status.kind === 'win' && (p.canMove === 'both' || p.status.winner === p.bottom.side);
      const tone = p.status.kind === 'draw' ? 'draw' : meWon ? 'win' : 'lose';
      setBanner({ text: p.resultTitle, tone, key: Date.now() });
      setTimeout(() => playEndSound(meWon), 260);
      vibrate(30);
      // 结果面板等大字横幅播完再弹（见下面横幅的计时）
    } else if (moved && !finished && c.check) {
      setBanner({ text: '将军', tone: 'check', key: Date.now() });
      vibrate(24);
    }
    if (!finished) setResultOpen(false);
    prev.current = { moveCount: c.moveCount, captures: c.captures, finished };
  }, [c.moveCount, c.captures, c.check, p.status, p.resultTitle, game, p.canMove, p.bottom.side]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(
      () => {
        setBanner(null);
        if (banner.tone !== 'check') setResultOpen(true);
      },
      banner.tone === 'check' ? 1300 : 1600,
    );
    return () => clearTimeout(t);
  }, [banner]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCgMove = (orig: Key, dest: Key) => {
    if (p.view.game === 'chess') {
      if (p.view.v.promotions.has(orig + dest)) {
        setPromo({ orig, dest });
        return;
      }
      p.onMove(orig + dest);
    } else {
      p.onMove(`${keyToSq(orig)}-${keyToSq(dest)}`);
    }
  };

  // 用时每秒刷新一次；走的这一方实时走字
  const [, setTick] = useState(0);
  useEffect(() => {
    if (p.status.kind !== 'playing') return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [p.status.kind]);
  const totals = totalsBySide(game, p.clock.times);
  if (p.status.kind === 'playing') totals[c.turn] += p.clock.elapsed();
  const timeOf = (side: Color) => formatClock(totals[side]);

  const captured = (side: Color) => (p.view.game === 'gomoku' ? [] : p.view.v.captured[side]);
  const playing = p.status.kind === 'playing';
  const hint = pendingConfirm ? '再点一次确认落子' : p.hint;

  return (
    <div className={`page game-page ${game}`}>
      <header className="game-head">
        <button className="icon-btn" onClick={back} aria-label="返回">
          <IconBack />
        </button>
        <div className="game-title">{p.title}</div>
        <button className="icon-btn" onClick={() => setShowSettings(true)} aria-label="设置">
          <IconSettings />
        </button>
      </header>
      {p.banner}
      <div className="table">
        <PlayerBar
          game={game}
          seat={p.top}
          active={playing && c.turn === p.top.side}
          captured={captured(p.top.side)}
          time={timeOf(p.top.side)}
          flipped={face}
        />
        <div className="board-area">
          {p.view.game === 'gomoku' ? (
            <GomokuBoard
              board={p.view.v.board}
              turn={p.view.v.turn}
              lastMove={p.view.v.lastMove?.at ?? null}
              winLine={p.view.v.winLine}
              interactive={playing && (p.canMove === 'both' || p.canMove === c.turn)}
              confirm={settings.confirm}
              onPlace={(at) => p.onMove(String(at))}
              onPendingChange={setPendingConfirm}
              onOccupied={() => showToast('这里已经有子了')}
            />
          ) : (
            <CgBoard
              key={`${game}-${boardReset}`}
              variant={p.view.game}
              fen={p.view.v.fen}
              turn={p.view.v.turn}
              dests={playing ? p.view.v.dests : NO_DESTS}
              lastMove={p.view.v.lastMove}
              check={p.view.v.check}
              orientation={p.orientation}
              movable={playing ? (p.canMove === 'both' ? c.turn : p.canMove === c.turn ? c.turn : null) : null}
              confirm={settings.confirm}
              face={face}
              onMove={handleCgMove}
              onPendingChange={setPendingConfirm}
              onIllegalTap={showToast}
            />
          )}
          {banner && (
            <div key={banner.key} className={`board-banner ${banner.tone}`} role="status">
              {banner.text}
            </div>
          )}
        </div>
        <PlayerBar
          game={game}
          seat={p.bottom}
          active={playing && c.turn === p.bottom.side}
          captured={captured(p.bottom.side)}
          time={timeOf(p.bottom.side)}
        />
      </div>
      <div className={`hint${pendingConfirm ? ' pending' : ''}${!playing ? ' over' : ''}`} aria-live="polite">
        {!playing && !resultOpen ? (
          <button className="hint-result" onClick={() => setResultOpen(true)}>
            {p.resultTitle}
          </button>
        ) : (
          hint
        )}
      </div>
      <nav className="action-bar">{p.actions}</nav>

      {promo && p.view.game === 'chess' && (
        <PromotionPicker
          color={p.view.v.turn}
          onPick={(t) => {
            p.onMove(promo.orig + promo.dest + t);
            setPromo(null);
          }}
          onCancel={() => {
            setPromo(null);
            setBoardReset((n) => n + 1); // 取消升变：棋盘回到落子前
          }}
        />
      )}
      {resultOpen && !playing && (
        <>
          <div className="scrim" onClick={() => setResultOpen(false)} />
          <div className="sheet result-sheet" role="dialog" aria-modal="true">
            <div className="sheet-handle" />
            <h2 className="result-title">{p.resultTitle}</h2>
            <p className="result-reason">{p.status.kind === 'playing' ? '' : p.status.reason}</p>
            <p className="result-times">
              用时 {GAMES[game].sideName[GAMES[game].firstSide]} {timeOf(GAMES[game].firstSide)} ·{' '}
              {GAMES[game].sideName[otherColor(GAMES[game].firstSide)]} {timeOf(otherColor(GAMES[game].firstSide))}
            </p>
            <div className="sheet-actions">
              <button className="btn btn-ghost" onClick={() => setResultOpen(false)}>
                看看棋盘
              </button>
              {p.result}
            </div>
          </div>
        </>
      )}
      {toast && (
        <div key={toast.key} className="toast" role="status">
          {toast.text}
        </div>
      )}
      <SettingsSheet open={showSettings} onClose={() => setShowSettings(false)} showFace={p.faceAllowed && game !== 'gomoku'} />
    </div>
  );
}

export const sideName = (game: AnyView['game'], side: Color) => GAMES[game].sideName[side];
