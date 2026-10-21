// 人机对战 / 同屏对战
import { useEffect, useMemo, useState } from 'react';
import { aiBestMove, cancelAI } from '../ai/engines';
import { GAMES, LEVEL_NAME, otherColor, type Color, type GameId, type Level } from '../core/types';
import { useLocalMatch } from '../game/useLocalMatch';
import { undoFor } from '../game/undo';
import { common, isLegal, replay } from '../game/view';
import { GameTable } from './GameTable';
import { IconFlip, IconRestart, IconUndo } from './icons';

interface Props {
  game: GameId;
  mode: 'ai' | 'local';
  humanSide: Color;
  level: Level;
  resume: boolean;
}

export function LocalGame({ game, mode, humanSide, level, resume }: Props) {
  const meta = GAMES[game];
  const { state, setMoves, restart } = useLocalMatch(game, mode, { humanSide, level, resume });
  const { moves } = state;
  const view = useMemo(() => replay(game, moves), [game, moves]);
  const c = common(view);
  const [thinking, setThinking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const ai = mode === 'ai';
  const human = state.humanSide;
  const aiSide = otherColor(human);

  // 轮到电脑就让它想
  useEffect(() => {
    if (!ai || c.status.kind !== 'playing' || c.turn === human) return;
    let stale = false;
    let done = false;
    setThinking(true);
    const started = Date.now();
    aiBestMove(game, moves, state.level).then((mv) => {
      done = true;
      // 至少"想"半秒，太快落子反而不自然
      const wait = Math.max(0, 500 - (Date.now() - started));
      setTimeout(() => {
        if (stale) return;
        setThinking(false);
        if (mv && isLegal(view, mv)) setMoves([...moves, mv]);
      }, wait);
    });
    return () => {
      stale = true;
      if (!done) cancelAI(game);
      setThinking(false);
    };
  }, [ai, c.status.kind, c.turn, human, game, moves, state.level, view, setMoves]);

  const onMove = (mv: string) => {
    if (isLegal(view, mv)) setMoves([...moves, mv]);
  };

  const undo = () => setMoves(ai ? undoFor(game, moves, human) : moves.slice(0, -1));
  const canUndo = ai ? moves.some((_, i) => (i % 2 === 0 ? meta.firstSide : otherColor(meta.firstSide)) === human) : moves.length > 0;

  const orientation: Color = ai ? (flipped ? aiSide : human) : flipped ? 'black' : 'white';
  const bottomSide = orientation;
  const topSide = otherColor(orientation);
  const seatName = (side: Color) => (ai ? (side === human ? '我' : `电脑 · ${LEVEL_NAME[state.level]}`) : meta.sideName[side]);

  let hint = '';
  if (c.status.kind === 'playing') {
    if (ai) hint = c.turn === human ? (c.check ? '被将军了，轮到你' : '轮到你了') : '电脑思考中…';
    else hint = `${meta.sideName[c.turn]}走${c.check ? ' · 将军' : ''}`;
  }
  let resultTitle = '和棋';
  if (c.status.kind === 'win') {
    resultTitle = ai ? (c.status.winner === human ? '你赢了' : '电脑赢了') : `${meta.sideName[c.status.winner]}胜`;
  }

  return (
    <GameTable
      view={view}
      title={`${meta.name} · ${ai ? '人机' : '同屏'}`}
      status={c.status}
      canMove={ai ? (thinking ? null : human) : 'both'}
      orientation={orientation}
      top={{ side: topSide, name: seatName(topSide), status: ai && topSide === aiSide && thinking ? '思考中' : undefined }}
      bottom={{ side: bottomSide, name: seatName(bottomSide), status: ai && bottomSide === aiSide && thinking ? '思考中' : undefined }}
      hint={hint}
      faceAllowed={!ai && !flipped}
      onMove={onMove}
      resultTitle={resultTitle}
      result={
        <button className="btn btn-primary" onClick={() => restart(ai)}>
          再来一局{ai ? '（换先后手）' : ''}
        </button>
      }
      actions={
        <>
          <button className="action" onClick={undo} disabled={!canUndo}>
            <IconUndo />
            <span>悔棋</span>
          </button>
          <button className="action" onClick={() => setFlipped((f) => !f)}>
            <IconFlip />
            <span>翻转</span>
          </button>
          <button
            className="action"
            onClick={() => {
              if (moves.length === 0 || c.status.kind !== 'playing' || window.confirm('重新开始这一局？')) restart(false);
            }}
          >
            <IconRestart />
            <span>重开</span>
          </button>
        </>
      }
    />
  );
}
