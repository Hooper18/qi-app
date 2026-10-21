import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // 相对路径：同一份产物既能挂在 tuchenguang.com/qi/，也能被 Capacitor 打进 APK
  base: './',
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: { host: true, port: 5188 },
  build: { sourcemap: false },
  worker: { format: 'iife' },
  test: { include: ['src/**/*.test.ts'], testTimeout: 60000 },
});
