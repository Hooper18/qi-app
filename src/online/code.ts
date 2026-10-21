// 房间号生成单独放：首页要用，但不该因此把联机库（supabase）打进首屏包
export function newRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export const onlineAvailable = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
