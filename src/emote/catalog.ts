// 表情目录：动画表情用 Google Noto 动画表情（Lottie，CC BY 4.0），快捷语仿斗地主。
export interface EmojiItem {
  id: string; // Unicode 码位，对应 public/emotes/<id>.json
  label: string;
  still?: number; // 面板里静止显示动画的哪个位置（0~1），默认 0.45
}

export const EMOJIS: EmojiItem[] = [
  { id: '1f602', label: '笑哭' },
  { id: '1f62d', label: '大哭' },
  { id: '1f621', label: '生气' },
  { id: '1f44d', label: '点赞' },
  { id: '1f618', label: '飞吻' },
  { id: '2764_fe0f', label: '爱心' },
  { id: '1f97a', label: '可怜' },
  { id: '1f60e', label: '墨镜' },
  { id: '1f914', label: '思考' },
  { id: '1f631', label: '惊吓' },
  { id: '1f44f', label: '鼓掌' },
  { id: '1f389', label: '庆祝' },
  { id: '1f422', label: '乌龟' },
  { id: '1f634', label: '睡着' },
  { id: '1f644', label: '白眼' },
  { id: '1f4a3', label: '炸弹', still: 0.05 },
];

export const PHRASES: { id: string; text: string }[] = [
  { id: 'p1', text: '快点吧，我等到花儿都谢了' },
  { id: 'p2', text: '这步走得妙啊！' },
  { id: 'p3', text: '手下留情～' },
  { id: 'p4', text: '失误失误，刚才不算' },
  { id: 'p5', text: '我要认真了' },
  { id: 'p6', text: '你是不是偷偷练过' },
  { id: 'p7', text: '认输吧，给你留点面子' },
  { id: 'p8', text: '再来一局！' },
];

export const isPhrase = (id: string) => /^p\d+$/.test(id);
export const phraseText = (id: string) => PHRASES.find((p) => p.id === id)?.text ?? '';
export const emojiLabel = (id: string) => EMOJIS.find((e) => e.id === id)?.label ?? '表情';
export const isKnownEmote = (id: string) => isPhrase(id) ? PHRASES.some((p) => p.id === id) : EMOJIS.some((e) => e.id === id);
export const stillFrame = (id: string) => EMOJIS.find((e) => e.id === id)?.still ?? 0.45;
