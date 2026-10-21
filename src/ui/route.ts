// 极简 hash 路由：#/ 首页；#/play?game=..&mode=..；#/room/1234?game=..
import { useEffect, useState } from 'react';

export interface Route {
  path: string;
  params: URLSearchParams;
}

const parse = (): Route => {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, query] = raw.split('?');
  return { path, params: new URLSearchParams(query ?? '') };
};

export function useRoute(): Route {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(path: string, params?: Record<string, string | number>, replace = false) {
  const q = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
  const url = `#${path}${q}`;
  if (replace) window.history.replaceState(null, '', url);
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = url;
}

export function back() {
  if (window.history.length > 1) window.history.back();
  else go('/', undefined, true);
}
