// 线性图标，统一 1.75 描边，跟随文字颜色
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const IconBack = () => (
  <svg viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconChevron = () => (
  <svg viewBox="0 0 24 24" {...base} aria-hidden className="row-chevron">
    <path d="M9 5l7 7-7 7" />
  </svg>
);
export const IconSettings = () => (
  <svg viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);
export const IconUndo = () => (
  <svg viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M9 7L5 11l4 4" />
    <path d="M5 11h9a5 5 0 010 10h-2" />
  </svg>
);
export const IconRestart = () => (
  <svg viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4v4.5h4.5" />
  </svg>
);
export const IconFlag = () => (
  <svg viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M6 21V4M6 4h10l-2 4 2 4H6" />
  </svg>
);
export const IconFlip = () => (
  <svg viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M7 4v14M4 15l3 3 3-3M17 20V6M14 9l3-3 3 3" />
  </svg>
);
