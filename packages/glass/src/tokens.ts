/**
 * The liqui design tokens, and the only copy of them.
 *
 * They used to live in `tokens.css`, which meant they lived in three places —
 * that stylesheet, the `cssVars` block the shadcn registry hands the CLI, and
 * anything in JavaScript that needed to know a default in order to diff against
 * it. Three hand-maintained copies of twelve colours is a drift bug with a
 * schedule. `tokens.css` is now generated from this file at build time
 * (tsdown.config.ts) and the registry's copy is checked against it
 * (apps/www/scripts/build-registry.mts).
 *
 * No imports on purpose: the build config and the registry script both read
 * this module directly, outside any bundler and without React.
 */

/**
 * The themeable properties — the ones that describe the material globally.
 * Deliberately not the whole `--lq-` namespace: `--lq-tail-rim`,
 * `--lq-fade-start` and friends are plumbing set by the one component that
 * needs them, and `--lq-radius` is written per surface from the `radius` prop,
 * so putting either in a theme would ship a control that does nothing.
 */
export const LIQUI_TOKENS = [
  'text',
  'text-dim',
  'tint',
  'tint-deep',
  'rim-hi',
  'rim-lo',
  'shadow',
  'highlight',
  'accent',
  'danger',
  'danger-text',
  'scrim',
] as const;

export type LiquiTokenName = (typeof LIQUI_TOKENS)[number];
export type LiquiTokens = Record<LiquiTokenName, string>;

export const defaultTokens: { light: LiquiTokens; dark: LiquiTokens } = {
  light: {
    text: 'rgba(28, 28, 40, 0.95)',
    'text-dim': 'rgba(28, 28, 40, 0.55)',
    // Full-strength ("regular") tint; the frost prop scales layer opacity.
    tint: 'rgba(255, 255, 255, 0.48)',
    'tint-deep': 'rgba(255, 255, 255, 0.14)',
    'rim-hi': 'rgba(255, 255, 255, 0.85)',
    'rim-lo': 'rgba(255, 255, 255, 0.28)',
    shadow: '0 24px 60px rgba(10, 15, 40, 0.35), 0 4px 14px rgba(10, 15, 40, 0.18)',
    highlight: 'rgba(255, 255, 255, 0.5)',
    accent: '#2f6bff',
    danger: '#e5484d',
    // The darker variant, used where the red has to survive as *text* on a
    // light surface rather than as a fill with white on top of it.
    'danger-text': '#c1272c',
    // Scrim behind modal surfaces.
    scrim: 'rgba(12, 14, 28, 0.32)',
  },
  dark: {
    text: 'rgba(245, 246, 255, 0.96)',
    'text-dim': 'rgba(245, 246, 255, 0.55)',
    tint: 'rgba(30, 32, 46, 0.62)',
    'tint-deep': 'rgba(18, 20, 32, 0.4)',
    'rim-hi': 'rgba(255, 255, 255, 0.5)',
    'rim-lo': 'rgba(255, 255, 255, 0.12)',
    shadow: '0 24px 60px rgba(0, 0, 5, 0.55), 0 4px 14px rgba(0, 0, 5, 0.35)',
    highlight: 'rgba(255, 255, 255, 0.18)',
    accent: '#6f9dff',
    danger: '#ff7076',
    'danger-text': '#ff7076',
    scrim: 'rgba(0, 0, 6, 0.48)',
  },
};

/**
 * Dark mode is keyed on both `[data-theme="dark"]` (liqui's own demo and
 * playground convention) and `.dark` (what shadcn's next-themes setup writes).
 */
export const DARK_SELECTOR = "[data-theme='dark'], .dark";

/** The shipped stylesheet, emitted into dist by the package build. */
export function tokensStylesheet(): string {
  const block = (selector: string, tokens: LiquiTokens) =>
    `${selector} {\n` +
    LIQUI_TOKENS.map((name) => `  --lq-${name}: ${tokens[name]};`).join('\n') +
    '\n}\n';

  return (
    `/* liqui glass tokens — generated from src/tokens.ts, do not edit.\n` +
    ` *\n` +
    ` * Shipped as a standalone stylesheet so a non-shadcn consumer can just\n` +
    ` * \`@import "@liqui-design/glass/tokens.css"\`. Registry users get the same\n` +
    ` * values injected into their own globals.css through each item's \`cssVars\`,\n` +
    ` * which is why nothing here is required by the anatomy in glass.css — every\n` +
    ` * rule there carries a fallback.\n` +
    ` */\n\n` +
    block(':root', defaultTokens.light) +
    '\n' +
    block(DARK_SELECTOR.replace(', ', ',\n'), defaultTokens.dark)
  );
}
