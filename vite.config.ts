import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 相对路径：同一份产物既能挂在 tuchenguang.com/qi/，也能被 Capacitor 打进 APK
  base: './',
  plugins: [react()],
  server: { host: true, port: 5188 },
  build: { sourcemap: false },
  worker: { format: 'es' },
  test: { include: ['src/**/*.test.ts'], testTimeout: 60000 },
});
