/**
 * Builds the registry, twice over, from one source of truth.
 *
 * 1. `shadcn build` flattens registry.json into public/r/*.json — what the CLI
 *    fetches when someone runs `shadcn add @liqui/button`.
 * 2. This script then emits registry/__index__.tsx, a lazy component map the
 *    docs site uses to render <ComponentPreview name="button-demo" />.
 *
 * Both read the same registry.json, so a demo can never drift from the code
 * that actually ships. Adding a component means editing registry.json only.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

import { defaultTokens, LIQUI_TOKENS } from '../../../packages/glass/src/tokens.ts';

type RegistryFile = { path: string; type: string; target?: string };
type RegistryItem = {
  name: string;
  type: string;
  title?: string;
  description?: string;
  meta?: { entry?: string; added?: string };
  files?: RegistryFile[];
  cssVars?: { theme?: Record<string, string>; light?: Record<string, string>; dark?: Record<string, string> };
};

const registry: { items: RegistryItem[] } = JSON.parse(
  await import('node:fs/promises').then((fs) => fs.readFile(join(appRoot, 'registry.json'), 'utf8')),
);

// --- 0. Token parity --------------------------------------------------------

// The `liqui` style item carries the design tokens as `cssVars`, because that is
// the only way the shadcn CLI can write them into someone's globals.css. That
// makes it a second copy of src/tokens.ts, which the stylesheet and the theme
// editor both read — and a second copy of twelve colours is a drift bug with a
// schedule. Checked here rather than generated into registry.json, so the
// mismatch is reported as a mismatch instead of being silently papered over on
// the next build.
const style = registry.items.find((item) => item.name === 'liqui');
if (!style?.cssVars) {
  throw new Error('registry.json: the "liqui" style item is missing its cssVars block.');
}
for (const mode of ['light', 'dark'] as const) {
  const declared = style.cssVars[mode] ?? {};
  for (const name of LIQUI_TOKENS) {
    const expected = defaultTokens[mode][name];
    if (declared[`lq-${name}`] !== expected) {
      throw new Error(
        `registry.json: cssVars.${mode}["lq-${name}"] is ${JSON.stringify(declared[`lq-${name}`])}, ` +
          `but packages/glass/src/tokens.ts says ${JSON.stringify(expected)}. ` +
          'Tokens live in tokens.ts; update registry.json to match.',
      );
    }
  }
  const extra = Object.keys(declared).filter(
    (key) => !LIQUI_TOKENS.includes(key.replace(/^lq-/, '') as (typeof LIQUI_TOKENS)[number]),
  );
  if (extra.length) {
    throw new Error(
      `registry.json: cssVars.${mode} declares ${extra.join(', ')}, which tokens.ts does not know about.`,
    );
  }
}

// --- 1. CLI payload ---------------------------------------------------------

execFileSync('pnpm', ['exec', 'shadcn', 'build', '--output', 'public/r'], {
  cwd: appRoot,
  stdio: 'inherit',
});

// --- 2. Docs component map --------------------------------------------------

// Examples and blocks are the things that render standalone — each is a file
// with a default export. A `registry:ui` item exports named parts and is never
// previewed on its own (the docs preview `button-demo`, not `button`).
const PREVIEWABLE_TYPES = new Set(['registry:example', 'registry:block']);
const previewable = registry.items.filter(
  (item) => PREVIEWABLE_TYPES.has(item.type) && item.files?.some((f) => f.path.endsWith('.tsx')),
);

// An example is one file, so "the first .tsx" identifies it. A block is a
// directory of them, and only one has the default export — which is not
// something the file list's order should be trusted to encode, since that order
// is otherwise free to change. `meta.entry` says it outright; shadcn passes the
// field through untouched.
function entryFile(item: RegistryItem): RegistryFile {
  const files = item.files!;
  if (item.meta?.entry) {
    const named = files.find((f) => f.path === item.meta!.entry);
    if (!named) {
      throw new Error(
        `${item.name}: meta.entry is "${item.meta.entry}", which is not in its files.`,
      );
    }
    return named;
  }
  return files.find((f) => f.path.endsWith('.tsx'))!;
}

const entries = previewable
  .map((item) => {
    const file = entryFile(item);
    // registry.json paths are relative to the app root; the generated index sits
    // one level down in registry/, so `@/` keeps the specifier valid either way.
    const importPath = `@/${file.path.replace(/\.tsx$/, '')}`;
    return `  "${item.name}": {
    name: "${item.name}",
    title: ${JSON.stringify(item.title ?? item.name)},
    description: ${JSON.stringify(item.description ?? '')},
    type: ${JSON.stringify(item.type)},
    source: ${JSON.stringify(file.path)},
    component: React.lazy(() => import("${importPath}")),
  },`;
  })
  .join('\n');

const index = `// Generated by scripts/build-registry.mts — do not edit.
// Regenerate with \`pnpm registry:build\` (runs automatically on dev/build).
import * as React from "react";

export interface RegistryEntry {
  name: string;
  title: string;
  description: string;
  type: string;
  source: string;
  component: React.LazyExoticComponent<React.ComponentType>;
}

export const Index: Record<string, RegistryEntry> = {
${entries}
};
`;

mkdirSync(join(appRoot, 'registry'), { recursive: true });
writeFileSync(join(appRoot, 'registry', '__index__.tsx'), index);

// --- 3. Ship dates, for the "New" badge -------------------------------------

// Every `registry:ui` item carries `meta.added`, the day it shipped. The badge
// derives from that rather than from a hand-kept list of what is new, so it
// expires on its own — the failure mode of the hand-kept list is that nobody
// remembers to empty it, and "New" quietly comes to mean "exists".
//
// Validated here rather than trusted: a missing date makes a component
// permanently un-new, and a mistyped one (2027 for 2026) pins a badge for a
// year. Both are silent everywhere else, and both are cheap to catch now.
const today = new Date().toISOString().slice(0, 10);
const dates = registry.items
  .filter((item) => item.type === 'registry:ui')
  .map((item) => {
    const added = item.meta?.added;
    if (!added || !/^\d{4}-\d{2}-\d{2}$/.test(added)) {
      throw new Error(
        `registry.json: "${item.name}" needs meta.added as YYYY-MM-DD (the day it shipped).`,
      );
    }
    if (added > today) {
      throw new Error(
        `registry.json: "${item.name}" is dated ${added}, which is in the future — its New badge would not expire until 30 days after that.`,
      );
    }
    return `  ${JSON.stringify(item.name)}: ${JSON.stringify(added)},`;
  })
  .join('\n');

writeFileSync(
  join(appRoot, 'registry', '__added__.ts'),
  `// Generated by scripts/build-registry.mts — do not edit.
// The day each component shipped, from registry.json's \`meta.added\`.
export const Added: Record<string, string> = {
${dates}
};
`,
);

// --- 4. Demo source, for the code tab ---------------------------------------

// Baked in at build time rather than read with fs at render time: a dynamic
// `readFile(process.cwd() + path)` makes Next trace the entire project into the
// server bundle. This module is imported only by ComponentPreview, which is a
// server component, so the strings never reach the client — keep it that way.
const sources = previewable
  .map((item) => {
    const file = entryFile(item);
    const text = readFileSync(join(appRoot, file.path), 'utf8')
      // Demos import from where the source lives in this repo; the CLI writes
      // those files elsewhere in a consumer project, so the displayed code is
      // rewritten to match. Otherwise copy-pasting a demo yields an import that
      // resolves to nothing.
      .replace(/@\/registry\/liqui\/ui\//g, '@/components/ui/')
      .replace(/@\/registry\/liqui\/components\//g, '@/components/')
      .replace(/@\/registry\/liqui\/lib\//g, '@/lib/')
      .trimEnd();
    return `  ${JSON.stringify(item.name)}: ${JSON.stringify(text)},`;
  })
  .join('\n');

writeFileSync(
  join(appRoot, 'registry', '__sources__.ts'),
  `// Generated by scripts/build-registry.mts — do not edit.
// Server-only: importing this from a client component would ship every demo's
// source text to the browser.
export const Sources: Record<string, string> = {
${sources}
};
`,
);

console.log(
  `registry: ${registry.items.length} items → public/r, ${previewable.length} previewable → registry/__index__.tsx + __sources__.ts`,
);
