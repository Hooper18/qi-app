// 三个电脑对手的统一入口。全部跑在 Worker 里，取消 = 直接 terminate，下次用时再起。
import type { GameId, Level } from '../core/types';
import XqWorker from './xq.worker.ts?worker';

const BASE = import.meta.env.BASE_URL;

interface Engine {
  bestMove(moves: string[], level: Level): Promise<string | null>;
  cancel(): void;
}

// ---- 国际象棋：Stockfish 19 lite（单线程 wasm，UCI 协议）----
const SF_LEVEL: Record<Level, { skill: number; ms: number }> = {
  1: { skill: 0, ms: 200 },
  2: { skill: 6, ms: 500 },
  3: { skill: 20, ms: 1200 },
};

class StockfishEngine implements Engine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private onLine: ((line: string) => void) | null = null;

  private boot() {
    if (this.worker && this.ready) return this.ready;
    const w = new Worker(`${BASE}engines/stockfish/stockfish-19-lite-single.js`);
    this.worker = w;
    w.onmessage = (e) => this.onLine?.(String(e.data));
    this.ready = new Promise<void>((resolve) => {
      this.onLine = (line) => {
        if (line === 'uciok') w.postMessage('isready');
        if (line === 'readyok') resolve();
      };
      w.postMessage('uci');
    });
    return this.ready;
  }

  async bestMove(moves: string[], level: Level) {
    await this.boot();
    const w = this.worker!;
    const { skill, ms } = SF_LEVEL[level];
    return new Promise<string | null>((resolve) => {
      this.onLine = (line) => {
        if (!line.startsWith('bestmove')) return;
        const mv = line.split(' ')[1];
        resolve(mv && mv !== '(none)' ? mv : null);
      };
      w.postMessage(`setoption name Skill Level value ${skill}`);
      w.postMessage(`position startpos${moves.length ? ' moves ' + moves.join(' ') : ''}`);
      w.postMessage(`go movetime ${ms}`);
    });
  }

  cancel() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    this.onLine = null;
  }
}

// ---- 中国象棋：象棋小巫师 ----
const XQ_MS: Record<Level, number> = { 1: 20, 2: 300, 3: 1500 };

class XiangqiEngine implements Engine {
  private worker: Worker | null = null;

  bestMove(moves: string[], level: Level) {
    this.worker ??= new XqWorker();
    const w = this.worker;
    return new Promise<string | null>((resolve) => {
      w.onmessage = (e) => resolve(e.data as string | null);
      w.postMessage({ moves, millis: XQ_MS[level] });
    });
  }

  cancel() {
    this.worker?.terminate();
    this.worker = null;
  }
}

// ---- 五子棋：Rapfi（Piskvork 协议）----
const RAPFI_LEVEL: Record<Level, { strength: number; ms: number }> = {
  1: { strength: 5, ms: 300 },
  2: { strength: 35, ms: 600 },
  3: { strength: 100, ms: 1500 },
};

class GomokuEngine implements Engine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private onOutput: ((out: string) => void) | null = null;

  private boot() {
    if (this.worker && this.ready) return this.ready;
    const w = new Worker(`${BASE}engines/rapfi/rapfi-single.js`);
    this.worker = w;
    this.ready = new Promise<void>((resolve) => {
      w.onmessage = (e) => {
        const d = e.data as { ready?: boolean; output?: string };
        if (d.ready) {
          w.postMessage('START 15');
          w.postMessage('INFO RULE 0'); // 自由规则：五连及以上胜，无禁手
          resolve();
        } else if (d.output) {
          this.onOutput?.(d.output);
        }
      };
    });
    return this.ready;
  }

  async bestMove(moves: string[], level: Level) {
    await this.boot();
    const w = this.worker!;
    const { strength, ms } = RAPFI_LEVEL[level];
    return new Promise<string | null>((resolve) => {
      this.onOutput = (out) => {
        const m = /^(\d+),(\d+)$/.exec(out);
        if (m) resolve(String(Number(m[2]) * 15 + Number(m[1])));
        else if (out.startsWith('ERROR')) resolve(null);
      };
      // 轮到走的一方的子标 1，另一方标 2；坐标是 "列,行"
      let side = moves.length % 2 === 0 ? 1 : 2;
      let cmd = 'BOARD';
      for (const m of moves) {
        const at = Number(m);
        cmd += ` ${at % 15},${Math.floor(at / 15)},${side}`;
        side = 3 - side;
      }
      w.postMessage(`INFO STRENGTH ${strength}`);
      w.postMessage(`INFO TIMEOUT_TURN ${ms}`);
      w.postMessage(cmd + ' DONE');
    });
  }

  cancel() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    this.onOutput = null;
  }
}

const engines: Partial<Record<GameId, Engine>> = {};

function engineFor(game: GameId): Engine {
  return (engines[game] ??= game === 'chess' ? new StockfishEngine() : game === 'xiangqi' ? new XiangqiEngine() : new GomokuEngine());
}

export function aiBestMove(game: GameId, moves: string[], level: Level) {
  return engineFor(game).bestMove(moves, level);
}

export function cancelAI(game: GameId) {
  engines[game]?.cancel();
}
