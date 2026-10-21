// 用无头 Chromium 分别冒烟测试 Stockfish 和 Rapfi Worker
import { chromium } from 'playwright';
const which = process.argv[2] ?? 'sf';
const b = await chromium.launch();
const p = await b.newPage();
p.on('console', (m) => console.log('console:', m.text().slice(0, 200)));
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto('http://localhost:5188/');
const out = await p.evaluate((which) => new Promise((resolve) => {
  const lines = [];
  const t0 = performance.now();
  const ts = () => Math.round(performance.now() - t0) + 'ms ';
  setTimeout(() => resolve(lines.concat('TIMEOUT')), 15000);
  if (which === 'sf') {
    const w = new Worker('/engines/stockfish/stockfish-19-lite-single.js');
    w.onerror = (e) => lines.push('error ' + e.message);
    w.onmessage = (e) => {
      const l = String(e.data);
      if (l === 'uciok') { lines.push(ts() + l); w.postMessage('setoption name Skill Level value 5'); w.postMessage('isready'); }
      if (l === 'readyok') { lines.push(ts() + l); w.postMessage('position startpos moves e2e4'); w.postMessage('go movetime 500'); }
      if (l.startsWith('bestmove')) { lines.push(ts() + l); resolve(lines); }
    };
    w.postMessage('uci');
  } else {
    const w = new Worker('/engines/rapfi/rapfi-single.js');
    w.onerror = (e) => lines.push('error ' + e.message);
    w.onmessage = (e) => {
      const d = e.data;
      lines.push(ts() + JSON.stringify(d).slice(0, 150));
      if (d.ready) for (const c of ['START 15', 'INFO RULE 0', 'INFO STRENGTH 30', 'INFO TIMEOUT_TURN 500', 'BOARD 7,7,2 8,8,1 DONE']) w.postMessage(c);
      if (d.output && d.output.startsWith('ERROR')) resolve(lines);
      if (d.output && /^\d+,\d+$/.test(d.output)) resolve(lines);
    };
  }
}), which);
console.log(out.join('\n'));
await b.close();
