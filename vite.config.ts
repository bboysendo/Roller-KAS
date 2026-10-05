import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the built dist/ can be opened from any folder or static host.
  base: './',
});
