import type { Color } from '../core/types';

const PIECES = [
  { t: 'q', label: '后' },
  { t: 'r', label: '车' },
  { t: 'b', label: '象' },
  { t: 'n', label: '马' },
];

export function PromotionPicker({ color, onPick, onCancel }: { color: Color; onPick: (t: string) => void; onCancel: () => void }) {
  return (
    <div className="promo-layer" onClick={onCancel}>
      <div className="promo-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="选择升变">
        <div className="promo-title">兵升变为</div>
        <div className="promo-options board-frame chess">
          <div className="cg-wrap">
            {PIECES.map((p) => (
              <button key={p.t} className="promo-btn" onClick={() => onPick(p.t)} aria-label={p.label}>
                <piece className={`${p.t}-piece ${color}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
