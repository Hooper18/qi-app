import { useState } from 'react';
import knight from '../assets/chess-knight.svg';
import xqKing from '../assets/xiangqi/red_king.svg';
import { GAMES, type GameId } from '../core/types';
import { IconChevron } from './icons';
import { NewGameSheet } from './NewGameSheet';
import { JoinRoomSheet } from './JoinRoomSheet';

const DESC: Record<GameId, string> = {
  xiangqi: '楚河汉界，红先黑后',
  chess: '标准规则，含易位、吃过路兵、升变',
  gomoku: '15 路棋盘，五子连珠即胜',
};

function Thumb({ game }: { game: GameId }) {
  if (game === 'gomoku') {
    return (
      <svg viewBox="0 0 44 44" className="thumb" aria-hidden>
        <defs>
          <radialGradient id="tb" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#5b5b5b" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>
          <radialGradient id="tw" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#cfcabf" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="18" r="11" fill="url(#tb)" />
        <circle cx="28" cy="27" r="11" fill="url(#tw)" />
      </svg>
    );
  }
  return <img className="thumb" src={game === 'chess' ? knight : xqKing} alt="" />;
}

export function Home() {
  const [picked, setPicked] = useState<GameId | null>(null);
  const [joining, setJoining] = useState(false);
  return (
    <div className="page home">
      <header className="home-head">
        <h1>对弈</h1>
        <p>两个人的棋盘</p>
      </header>
      <div className="row-list">
        {(Object.keys(GAMES) as GameId[]).map((id) => (
          <button key={id} className="row" onClick={() => setPicked(id)}>
            <Thumb game={id} />
            <div className="row-main">
              <div className="row-title">{GAMES[id].name}</div>
              <div className="row-desc">{DESC[id]}</div>
            </div>
            <IconChevron />
          </button>
        ))}
      </div>
      <div className="home-foot">
        <button className="btn btn-ghost" onClick={() => setJoining(true)}>
          输入房间号加入联机
        </button>
      </div>
      <NewGameSheet game={picked} onClose={() => setPicked(null)} />
      <JoinRoomSheet open={joining} onClose={() => setJoining(false)} />
    </div>
  );
}
