import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Point at the kernel's source, not its dist: the playground is where the
    // refraction work happens, and going through a build step would cost HMR on
    // every filter tweak. Array form (not object) because a string alias matches
    // as a prefix, which would rewrite `@liqui-design/glass/tokens.css` into
    // `…/index.ts/tokens.css`.
    alias: [
      {
        find: /^@liqui-design\/glass$/,
        replacement: fileURLToPath(new URL('../../packages/glass/src/index.ts', import.meta.url)),
      },
      {
        find: /^@liqui-design\/glass\//,
        replacement: fileURLToPath(new URL('../../packages/glass/src/', import.meta.url)),
      },
    ],
  },
});
