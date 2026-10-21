// 联机对战
import { useEffect, useMemo, useState } from 'react';
import { GAMES, otherColor, type GameId, type GameStatus } from '../core/types';
import { onlineAvailable } from '../online/room';
import { useRoom } from '../online/useRoom';
import { undoFor } from '../game/undo';
import { common, isLegal, replay } from '../game/view';
import { GameTable } from './GameTable';
import { IconBack, IconFlag, IconRestart, IconUndo } from './icons';
import { back } from './route';
import { Sheet } from './Sheet';

export function OnlineGame({ code, createGame }: { code: string; createGame: GameId | null }) {
  if (!onlineAvailable) return <Waiting code={code} text="这个版本没有配置联机服务" />;
  return <OnlineRoom code={code} createGame={createGame} />;
}

function Waiting({ code, text }: { code: string; text: string }) {
  return (
    <div className="page">
      <header className="game-head">
        <button className="icon-btn" onClick={back} aria-label="返回">
          <IconBack />
        </button>
        <div className="game-title">房间 {code}</div>
        <span className="icon-btn" />
      </header>
      <div className="waiting">{text}</div>
    </div>
  );
}

function OnlineRoom({ code, createGame }: { code: string; createGame: GameId | null }) {
  const room = useRoom(code, createGame);
  const [slow, setSlow] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!room.notice) return;
    const t = setTimeout(room.clearNotice, 2500);
    return () => clearTimeout(t);
  }, [room.notice, room.clearNotice]);

  const state = room.state;
  const view = useMemo(() => (state ? replay(state.game, state.moves) : null), [state]);

  if (!state || !view || !room.mySide) {
    const text =
      room.conn === 'offline'
        ? '连不上联机服务，检查一下网络'
        : slow && room.conn === 'connected'
          ? '房间里还没有人。确认房间号对不对，或者让对方先创建房间'
          : '正在进入房间…';
    return <Waiting code={code} text={text} />;
  }

  const meta = GAMES[state.game];
  const me = room.mySide;
  const opp = otherColor(me);
  const c = common(view);
  const status: GameStatus = state.resigned
    ? { kind: 'win', winner: otherColor(state.resigned), reason: `${meta.sideName[state.resigned]}认输` }
    : c.status;
  const playing = status.kind === 'playing';

  const onMove = (mv: string) => {
    if (playing && c.turn === me && isLegal(view, mv)) room.commit({ ...state, moves: [...state.moves, mv] });
  };
  const restartState = () => room.commit({ ...state, moves: [], resigned: null, hostSide: otherColor(state.hostSide) });

  let hint = '';
  if (playing) hint = c.turn === me ? (c.check ? '被将军了，轮到你' : '轮到你了') : '等对方走…';
  const resultTitle = status.kind === 'win' ? (status.winner === me ? '你赢了' : '对方赢了') : '和棋';
  const myMoves = state.moves.filter((_, i) => (i % 2 === 0 ? meta.firstSide : otherColor(meta.firstSide)) === me).length;
  const offline = room.conn === 'offline';
  const connecting = room.conn === 'connecting';

  return (
    <>
      <GameTable
        view={view}
        title={`${meta.name} · 联机`}
        status={status}
        canMove={playing ? me : null}
        orientation={me}
        top={{ side: opp, name: '对方', status: room.conn === 'connected' && room.peers === 0 ? '未进入' : undefined }}
        bottom={{ side: me, name: `我（${meta.sideName[me]}）` }}
        hint={hint}
        faceAllowed={false}
        onMove={onMove}
        resultTitle={resultTitle}
        banner={
          <div className="room-banner">
            <span>
              房间号 <b>{code}</b>
            </span>
            <span className={`conn ${offline ? 'off' : room.peers > 0 ? 'on' : 'wait'}`}>
              {offline ? '连接中断，正在重连' : connecting ? '正在连接…' : room.peers > 0 ? '对方在线' : '把房间号发给对方'}
            </span>
          </div>
        }
        result={
          <button className="btn btn-primary" onClick={() => room.ask('restart')} disabled={room.outgoing !== null}>
            再来一局
          </button>
        }
        actions={
          <>
            <button
              className="action"
              onClick={() => room.ask('undo')}
              disabled={!playing || myMoves === 0 || room.outgoing !== null}
            >
              <IconUndo />
              <span>悔棋</span>
            </button>
            {playing ? (
              <button className="action" onClick={() => setConfirmResign(true)}>
                <IconFlag />
                <span>认输</span>
              </button>
            ) : (
              <button className="action" onClick={() => room.ask('restart')} disabled={room.outgoing !== null}>
                <IconRestart />
                <span>再来</span>
              </button>
            )}
          </>
        }
      />
      <Sheet open={room.incoming !== null} onClose={() => room.answer(false, () => {})}>
        <h2 className="sheet-title">对方请求{room.incoming?.kind === 'undo' ? '悔棋' : '重新开始'}</h2>
        <p className="sheet-sub">
          {room.incoming?.kind === 'restart' ? '同意后开新的一局，先后手互换。' : '同意后棋盘退回到对方上一步之前。'}
        </p>
        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={() => room.answer(false, () => {})}>
            拒绝
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              room.answer(true, () => {
                if (room.incoming?.kind === 'undo') room.commit({ ...state, moves: undoFor(state.game, state.moves, opp) });
                else restartState();
              })
            }
          >
            同意
          </button>
        </div>
      </Sheet>
      <Sheet open={confirmResign} onClose={() => setConfirmResign(false)}>
        <h2 className="sheet-title">确定认输？</h2>
        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={() => setConfirmResign(false)}>
            再想想
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setConfirmResign(false);
              room.commit({ ...state, resigned: me });
            }}
          >
            认输
          </button>
        </div>
      </Sheet>
      {room.outgoing && <div className="toast">已发送请求，等对方回应…</div>}
      {room.notice && !room.outgoing && <div className="toast">{room.notice}</div>}
    </>
  );
}
