import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', fs: { strict: true, allow: ['.'] } },
  test: { environment: 'jsdom', include: ['tests/**/*.test.{js,jsx}'], setupFiles: ['tests/setup.js'] },
});
