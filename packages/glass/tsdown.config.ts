import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';

import { tokensStylesheet } from './src/tokens.ts';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  // `./glass.css` stays external so the `import './glass.css'` in LiquiGlass.tsx
  // survives into dist/index.js — the consumer's bundler resolves it against the
  // copied file. Inlining it would put CSS text inside a JS module, which Next's
  // server graph rejects. `sideEffects: ["**/*.css"]` keeps it from being shaken
  // out on the way through.
  external: ['react', 'react-dom', /\.css$/],
  hooks: {
    'build:done': () => {
      // glass.css is the surface anatomy — hand-written, and nothing generates
      // it. tokens.css is the design tokens, which exist as data in
      // src/tokens.ts because the theme editor has to diff against them; the
      // stylesheet is one rendering of that data, so it is emitted rather than
      // maintained beside it.
      copyFileSync('src/glass.css', 'dist/glass.css');
      writeFileSync('dist/tokens.css', tokensStylesheet());

      // The same externalization also copies the CSS import into index.d.ts,
      // where TypeScript can't resolve a `.css` specifier under node16/bundler
      // resolution (it strips the extension and looks for glass.d.css.ts).
      // A side-effect import has no meaning in a declaration file anyway.
      const dts = 'dist/index.d.ts';
      writeFileSync(dts, readFileSync(dts, 'utf8').replace(/^import ["'][^"']+\.css["'];\n/gm, ''));
    },
  },
});
