import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Array form (not object) because a string alias matches as a prefix, which
    // would rewrite `@liqui-design/glass/tokens.css` into `…/index.ts/tokens.css`.
    alias: [
      // Point at the kernel's source, not its dist: the playground is where the
      // refraction work happens, and going through a build step would cost HMR
      // on every filter tweak.
      {
        find: /^@liqui-design\/glass$/,
        replacement: resolve('../../packages/glass/src/index.ts'),
      },
      {
        find: /^@liqui-design\/glass\//,
        replacement: resolve('../../packages/glass/src/'),
      },
      // The components themselves come straight from the registry, which is the
      // single source of truth for what `shadcn add` ships. The playground used
      // to keep its own copies; they drifted the moment the registry ones were
      // rewritten onto Tailwind.
      { find: /^@registry\//, replacement: resolve('../www/registry/liqui/') },
      // The optics panel is shared with the home stage so the two cannot drift.
      { find: /^@shared\//, replacement: resolve('../www/components/') },
      // Registry components import `cn` from where the CLI puts it in a consumer
      // project, so that specifier has to resolve here too.
      { find: /^@\/lib\/utils$/, replacement: resolve('../www/registry/liqui/lib/utils.ts') },
      // Same reason, for the components that import each other: toggle-group
      // reaches for toggle by the specifier the CLI rewrites into
      // `@/components/ui/toggle`, so it has to resolve here too.
      { find: /^@\/registry\//, replacement: resolve('../www/registry/') },
    ],
  },
});
