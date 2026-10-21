// 原生壳（APK）专属：返回键、状态栏颜色、震动。网页端全部跳过。
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = Capacitor.isNativePlatform();

export function initNative() {
  if (!isNative) return;
  // 安卓返回键：能后退就后退，在首页就退出
  void App.addListener('backButton', () => {
    const atHome = !window.location.hash || window.location.hash === '#/' || window.location.hash === '#';
    if (atHome) void App.exitApp();
    else window.history.back();
  });
  // 状态栏跟随深浅色，颜色和 app.css 的 --bg 一致
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = (dark: boolean) => {
    void StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
    void StatusBar.setBackgroundColor({ color: dark ? '#212121' : '#FAF9F7' }).catch(() => {});
  };
  apply(mq.matches);
  mq.addEventListener('change', (e) => apply(e.matches));
}

export function nativeTap(strong: boolean) {
  void Haptics.impact({ style: strong ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
}
