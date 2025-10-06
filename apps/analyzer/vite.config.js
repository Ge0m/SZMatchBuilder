import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/react-app-test/analyzer/',
  build: {
    outDir: '../../docs/analyzer',
    emptyOutDir: true
  },
  plugins: [react()]
});
