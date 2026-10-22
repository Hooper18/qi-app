// 发送方信息条旁边弹出的表情气泡：动画表情或快捷语文字
import { isPhrase, phraseText } from './catalog';
import { LottieEmote } from './LottieEmote';

export interface EmoteShow {
  id: string;
  key: number;
}

export function EmoteBubble({ emote, place }: { emote: EmoteShow; place: 'above' | 'below' }) {
  const phrase = isPhrase(emote.id);
  return (
    <div key={emote.key} className={`emote-bubble ${place}${phrase ? ' phrase' : ''}`} role="status">
      {phrase ? <span>{phraseText(emote.id)}</span> : <LottieEmote id={emote.id} playing size={84} />}
    </div>
  );
}
