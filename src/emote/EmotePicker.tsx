// 表情面板：上面 4x4 动画表情（静止显示），下面快捷语。点一下就发出去。
import { Sheet } from '../ui/Sheet';
import { EMOJIS, PHRASES } from './catalog';
import { LottieEmote } from './LottieEmote';

export function EmotePicker({ open, title, onPick, onClose }: { open: boolean; title: string; onPick: (id: string) => void; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="sheet-title">{title}</h2>
      <div className="emote-grid">
        {EMOJIS.map((e) => (
          <button key={e.id} className="emote-cell" onClick={() => onPick(e.id)} aria-label={e.label}>
            <LottieEmote id={e.id} playing={false} size={44} />
          </button>
        ))}
      </div>
      <div className="phrase-list">
        {PHRASES.map((p) => (
          <button key={p.id} className="phrase-chip" onClick={() => onPick(p.id)}>
            {p.text}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
