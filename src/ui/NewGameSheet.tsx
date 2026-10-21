import { useEffect, useState } from 'react';
import { GAMES, LEVEL_NAME, type Color, type GameId, type Level } from '../core/types';
import { loadSave } from '../game/useLocalMatch';
import { newRoomCode } from '../online/code';
import { IconChevron } from './icons';
import { go } from './route';
import { Segmented, Sheet } from './Sheet';

type Step = 'mode' | 'ai' | 'online';
type SidePick = 'first' | 'second' | 'random';

export function NewGameSheet({ game, onClose }: { game: GameId | null; onClose: () => void }) {
  const [step, setStep] = useState<Step>('mode');
  const [side, setSide] = useState<SidePick>('first');
  const [level, setLevel] = useState<Level>(2);
  useEffect(() => setStep('mode'), [game]);
  if (!game) return null;
  const meta = GAMES[game];
  const second: Color = meta.firstSide === 'white' ? 'black' : 'white';
  const aiSave = loadSave(game, 'ai');
  const localSave = loadSave(game, 'local');

  const startAI = () => {
    const pick = side === 'random' ? (Math.random() < 0.5 ? 'first' : 'second') : side;
    go('/play', { game, mode: 'ai', side: pick === 'first' ? meta.firstSide : second, level });
  };

  return (
    <Sheet open onClose={onClose}>
      <h2 className="sheet-title">{meta.name}</h2>
      {step === 'mode' && (
        <>
          <p className="sheet-sub">选择对局方式</p>
          {(aiSave || localSave) && (
            <div className="row-list resume-list">
              {aiSave && (
                <button className="row" onClick={() => go('/play', { game, mode: 'ai', resume: 1 })}>
                  <div className="row-main">
                    <div className="row-title">继续人机对局</div>
                    <div className="row-desc">
                      {LEVEL_NAME[aiSave.level]} · 已走 {aiSave.moves.length} 步
                    </div>
                  </div>
                  <IconChevron />
                </button>
              )}
              {localSave && (
                <button className="row" onClick={() => go('/play', { game, mode: 'local', resume: 1 })}>
                  <div className="row-main">
                    <div className="row-title">继续同屏对局</div>
                    <div className="row-desc">已走 {localSave.moves.length} 步</div>
                  </div>
                  <IconChevron />
                </button>
              )}
              <div className="sheet-divider" />
            </div>
          )}
          <div className="row-list">
            <button className="row" onClick={() => setStep('ai')}>
              <div className="row-main">
                <div className="row-title">人机对战</div>
                <div className="row-desc">一个人和电脑下</div>
              </div>
              <IconChevron />
            </button>
            <button className="row" onClick={() => go('/play', { game, mode: 'local' })}>
              <div className="row-main">
                <div className="row-title">同屏对战</div>
                <div className="row-desc">两个人轮流用这一台手机</div>
              </div>
              <IconChevron />
            </button>
            <button className="row" onClick={() => setStep('online')}>
              <div className="row-main">
                <div className="row-title">联机对战</div>
                <div className="row-desc">各用各的手机，房间号连上就能下</div>
              </div>
              <IconChevron />
            </button>
          </div>
        </>
      )}
      {step === 'ai' && (
        <>
          <p className="sheet-sub">人机对战</p>
          <div className="field">
            <div className="field-label">我执</div>
            <Segmented<SidePick>
              value={side}
              onChange={setSide}
              options={[
                { value: 'first', label: `${meta.sideName[meta.firstSide]}（先走）` },
                { value: 'second', label: meta.sideName[second] },
                { value: 'random', label: '随机' },
              ]}
            />
          </div>
          <div className="field">
            <div className="field-label">电脑难度</div>
            <Segmented<Level>
              value={level}
              onChange={setLevel}
              options={[1, 2, 3].map((l) => ({ value: l as Level, label: LEVEL_NAME[l as Level] }))}
            />
          </div>
          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={() => setStep('mode')}>
              返回
            </button>
            <button className="btn btn-primary" onClick={startAI}>
              开始
            </button>
          </div>
        </>
      )}
      {step === 'online' && (
        <>
          <p className="sheet-sub">创建一个房间，把 4 位房间号发给对方，对方在首页输入房间号就能进来。</p>
          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={() => setStep('mode')}>
              返回
            </button>
            <button className="btn btn-primary" onClick={() => go(`/room/${newRoomCode()}`, { game, host: 1 })}>
              创建房间
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
