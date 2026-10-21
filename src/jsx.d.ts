import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// chessgroundx 的棋子是 <piece> 自定义标签，升变选择器里复用同一套样式
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      piece: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
