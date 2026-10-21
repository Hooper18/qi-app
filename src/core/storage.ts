// localStorage 的安全封装：隐私模式、存储被禁时不报错。
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`qi:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(`qi:${key}`, JSON.stringify(value));
  } catch {
    /* 存不了就算了，不影响下棋 */
  }
}

export function remove(key: string) {
  try {
    localStorage.removeItem(`qi:${key}`);
  } catch {
    /* ignore */
  }
}
