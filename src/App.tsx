import { lazy, Suspense } from 'react';
import { GAMES, type Color, type GameId, type Level } from './core/types';
import { Home } from './ui/Home';
import { LocalGame } from './ui/LocalGame';
import { useRoute } from './ui/route';

// 联机页按需加载：supabase 库只有联机才用得到
const OnlineGame = lazy(() => import('./ui/OnlineGame'));

const isGame = (g: string | null): g is GameId => !!g && g in GAMES;

export function App() {
  const { path, params } = useRoute();
  const game = params.get('game');

  if (path === '/play' && isGame(game)) {
    const mode = params.get('mode') === 'local' ? 'local' : 'ai';
    const sideParam = params.get('side');
    const side: Color = sideParam === 'white' || sideParam === 'black' ? sideParam : GAMES[game].firstSide;
    const level = Math.min(3, Math.max(1, Number(params.get('level') ?? 2))) as Level;
    const resume = params.get('resume') === '1';
    // key 用完整 hash：换参数时整个对局组件重建
    return (
      <LocalGame
        key={window.location.hash}
        game={game}
        mode={mode}
        humanSide={side}
        level={level}
        resume={resume}
      />
    );
  }
  const room = /^\/room\/(\d{4})$/.exec(path);
  if (room) {
    return (
      <Suspense fallback={null}>
        <OnlineGame key={room[1]} code={room[1]} createGame={params.get('host') === '1' && isGame(game) ? game : null} />
      </Suspense>
    );
  }
  return <Home />;
}
