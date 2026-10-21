import { useEffect, useRef, useState } from 'react';
import { go } from './route';
import { Sheet } from './Sheet';

export function JoinRoomSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setCode('');
      setTimeout(() => input.current?.focus(), 250);
    }
  }, [open]);
  const join = () => code.length === 4 && go(`/room/${code}`);
  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="sheet-title">加入联机</h2>
      <p className="sheet-sub">输入对方发给你的 4 位房间号</p>
      <input
        ref={input}
        className="code-input"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={code}
        aria-label="房间号"
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
        onKeyDown={(e) => e.key === 'Enter' && join()}
      />
      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn btn-primary" disabled={code.length !== 4} onClick={join}>
          加入
        </button>
      </div>
    </Sheet>
  );
}
