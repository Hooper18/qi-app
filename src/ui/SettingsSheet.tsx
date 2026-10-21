import { useSettings } from '../core/settings';
import { Sheet, Switch } from './Sheet';

export function SettingsSheet({ open, onClose, showFace }: { open: boolean; onClose: () => void; showFace: boolean }) {
  const [s, set] = useSettings();
  const rows: { key: keyof typeof s; title: string; desc: string; show?: boolean }[] = [
    { key: 'confirm', title: '落子确认', desc: '点目标位置先预览，再点一次才落子' },
    { key: 'face', title: '对坐模式', desc: '上方一方的棋子倒过来，适合手机平放、两人面对面', show: showFace },
    { key: 'sound', title: '落子音效', desc: '' },
    { key: 'vibrate', title: '震动反馈', desc: '' },
  ];
  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="sheet-title">设置</h2>
      <div className="switch-list">
        {rows
          .filter((r) => r.show !== false)
          .map((r) => (
            <div className="switch-row" key={r.key}>
              <div className="switch-text">
                {r.title}
                {r.desc && <small>{r.desc}</small>}
              </div>
              <Switch label={r.title} checked={s[r.key]} onChange={(v) => set({ [r.key]: v })} />
            </div>
          ))}
      </div>
    </Sheet>
  );
}
