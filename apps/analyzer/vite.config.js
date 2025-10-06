import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/SZMatchBuilder/analyzer/',
  build: {
    outDir: '../../dist/analyzer',
    emptyOutDir: true
  },
  plugins: [react()]
});
