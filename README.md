# 对弈

两个人玩的棋：中国象棋、国际象棋、五子棋。手机优先，支持人机、同屏、联机三种模式，落子两步确认。

- 网页版：https://chess.tuchenguang.com （Vercel 项目 tusts/qi-app，push main 自动部署）
- 安卓：主站下载栏（https://tuchenguang.com/apps）

## 用到的开源项目

| 用途 | 项目 | 许可 |
|---|---|---|
| 棋盘交互与动画（象棋 / 国际象棋） | [chessgroundx](https://github.com/gbtami/chessgroundx)（lichess chessground 分支） | GPL-3.0 |
| 国际象棋规则 | [chess.js](https://github.com/jhlywa/chess.js) | BSD-2 |
| 国际象棋电脑 | [Stockfish.js](https://github.com/nmrugg/stockfish.js) 19 lite 单线程 | GPL-3.0 |
| 中国象棋电脑 | [象棋小巫师 xqwlight](https://github.com/xqbase/xqwlight) JS 版 | GPL-2.0+ |
| 五子棋电脑 | [Rapfi](https://github.com/dhbloo/rapfi) wasm（取自 gomocalc） | GPL-3.0 |
| 象棋棋子与棋盘 | [Kadagaden/chess-pieces](https://github.com/Kadagaden/chess-pieces) gmchess 木纹套 | CC BY 4.0 |
| 国际象棋棋子 | cburnett（Colin M.L. Burnett） | GPL |

中国象棋规则（含长将判负、60 回合判和）和五子棋规则是自己写的，有 perft 测试。

## 联机

Supabase Realtime 广播频道，不建表不登录。4 位房间号，双方互发带版本号的全量状态，版本高的为准；本地存一份，刷新/断线重连后自动补齐。

## 开发

```bash
npm install
npm run dev        # http://localhost:5188
npm test
npm run build
```

需要 `.env.local`：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（没有就只是联机不可用）。

冒烟脚本（先开 dev server）：`node scripts/engine-smoke.mjs`（三个引擎）、`node scripts/online-smoke.mjs`（两个页面联机）。

## 打包 APK

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

签名读 `android/key.properties`（不入库）。
