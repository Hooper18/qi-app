// 落子音效（WebAudio 现场合成，不用音频文件）+ 短震动。
import { getSettings } from './settings';
import type { GameId } from './types';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!getSettings().sound) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// 一下短促的敲击：滤波噪声做"木头/石头"的质感 + 很轻的低频做"落下"的分量
function knock(freq: number, q: number, gain: number, decay: number, delay = 0) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const len = Math.ceil(ac.sampleRate * decay);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + decay);
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(t);

  const osc = ac.createOscillator();
  osc.frequency.setValueAtTime(freq / 6, t);
  osc.frequency.exponentialRampToValueAtTime(freq / 12, t + decay);
  const og = ac.createGain();
  og.gain.setValueAtTime(gain * 0.35, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + decay * 0.8);
  osc.connect(og).connect(ac.destination);
  osc.start(t);
  osc.stop(t + decay);
}

const TONE: Record<GameId, { freq: number; q: number }> = {
  xiangqi: { freq: 1100, q: 2.2 }, // 木子拍在木盘上，偏闷
  chess: { freq: 1500, q: 2.8 },
  gomoku: { freq: 2600, q: 4 }, // 石子，偏脆
};

export function playMoveSound(game: GameId, capture: boolean) {
  const { freq, q } = TONE[game];
  knock(freq, q, capture ? 0.9 : 0.6, 0.09);
  if (capture) knock(freq * 0.8, q, 0.5, 0.08, 0.06);
}

export function playEndSound(win: boolean) {
  const ac = audio();
  if (!ac) return;
  const notes = win ? [523.25, 659.25, 783.99] : [392, 329.63];
  notes.forEach((f, i) => {
    const t = ac.currentTime + i * 0.12;
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + 0.55);
  });
}

export function vibrate(ms = 12) {
  if (!getSettings().vibrate) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* 不支持就算了 */
  }
}
