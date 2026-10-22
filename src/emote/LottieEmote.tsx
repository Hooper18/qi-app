// 播放一个 Noto 动画表情。lottie-web（light 版，只含 SVG 渲染）和表情数据都按需加载并缓存。
import { useEffect, useRef } from 'react';
import { stillFrame } from './catalog';

type LottieModule = typeof import('lottie-web/build/player/lottie_light');
let lottie: Promise<LottieModule> | null = null;
const dataCache = new Map<string, Promise<string>>();

const loadLottie = () => (lottie ??= import('lottie-web/build/player/lottie_light'));
// 存原始文本：lottie 会改动传进去的对象，每个实例要各自 parse 一份
const loadData = (id: string) => {
  let p = dataCache.get(id);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}emotes/${id}.json`).then((r) => {
      if (!r.ok) throw new Error(`表情 ${id} 加载失败`);
      return r.text();
    });
    p.catch(() => dataCache.delete(id));
    dataCache.set(id, p);
  }
  return p;
};

export function preloadEmotes(ids: string[]) {
  void loadLottie();
  ids.forEach((id) => void loadData(id).catch(() => {}));
}

export function LottieEmote({ id, playing, size }: { id: string; playing: boolean; size: number }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let dead = false;
    let anim: ReturnType<LottieModule['default']['loadAnimation']> | null = null;
    Promise.all([loadLottie(), loadData(id)])
      .then(([mod, text]) => {
        if (dead || !box.current) return;
        anim = mod.default.loadAnimation({
          container: box.current,
          renderer: 'svg',
          loop: playing,
          autoplay: playing,
          animationData: JSON.parse(text),
        });
        // 不播放时停在动画中段，静态图也有表情
        if (!playing) anim.addEventListener('DOMLoaded', () => anim?.goToAndStop(Math.floor(anim.totalFrames * stillFrame(id)), true));
      })
      .catch(() => {});
    return () => {
      dead = true;
      anim?.destroy();
    };
  }, [id, playing]);
  return <div ref={box} className="lottie-emote" style={{ width: size, height: size }} aria-hidden />;
}
