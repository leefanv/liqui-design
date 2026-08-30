import {
  defaultGlassTheme,
  defaultTokens,
  LIQUI_TOKENS,
  themeCss,
  type LiquiGlassTheme,
  type LiquiTheme,
  type LiquiTokenName,
  type LiquiTokens,
} from '@liqui-design/glass';

import {
  clamp,
  formatHex,
  formatRgba,
  hslToRgb,
  parseColor,
  rgbToHsl,
  withAlpha,
  type Rgba,
} from './color';

/**
 * The editor's model.
 *
 * The source of truth is the *resolved* token set, not the knob positions. A
 * knob is a lens over one or two tokens: it reads its position out of them and
 * writes a patch back. Nothing recomputes a token that wasn't touched, which is
 * what keeps `themeCss` emitting only genuine edits — round-tripping every
 * token through a derivation on every render would flag half the palette as
 * changed on the first keystroke, purely from formatting.
 *
 * It also means the advanced pane (raw token strings) and the plain pane are
 * editing the same object rather than two representations that must be kept in
 * sync, so dropping into raw values and back out again loses nothing.
 */

export type ColorMode = 'light' | 'dark';

export type ThemePatch = {
  glass?: Partial<LiquiGlassTheme>;
  light?: Partial<LiquiTokens>;
  dark?: Partial<LiquiTokens>;
};

export const defaultLiquiTheme: LiquiTheme = {
  glass: defaultGlassTheme,
  light: defaultTokens.light,
  dark: defaultTokens.dark,
};

/* -------------------------------------------------------------------------- */
/* Derivations                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The light↔dark relationship of the shipped brand colours, read off them
 * directly: `#2f6bff` → `#6f9dff` is the same hue at the same saturation with
 * lightness moved 31% of the way to white, and the shipped danger pair sits on
 * the same curve. Hue and saturation are left alone — a brand colour that
 * drifts hue between modes stops being one colour.
 */
const DARK_LIFT = 0.31;

export function toDarkVariant(css: string): string {
  const rgb = parseColor(css);
  if (!rgb) return css;
  const hsl = rgbToHsl(rgb);
  return formatHex(hslToRgb({ ...hsl, l: hsl.l + (1 - hsl.l) * DARK_LIFT }));
}

export function toLightVariant(css: string): string {
  const rgb = parseColor(css);
  if (!rgb) return css;
  const hsl = rgbToHsl(rgb);
  return formatHex(hslToRgb({ ...hsl, l: clamp((hsl.l - DARK_LIFT) / (1 - DARK_LIFT), 0, 1) }));
}

/**
 * `--lq-danger-text` is the same red as `--lq-danger`, dark enough to survive as
 * *text* on a light glass surface — the fill can sit at any lightness because
 * white sits on top of it, but a validation message cannot. In dark mode the
 * surface is already dark, so the two are the same colour.
 */
const DANGER_TEXT_MAX_L = 0.46;

export function toDangerText(css: string, mode: ColorMode): string {
  if (mode === 'dark') return css;
  const rgb = parseColor(css);
  if (!rgb) return css;
  const hsl = rgbToHsl(rgb);
  return formatHex(hslToRgb({ ...hsl, l: Math.min(hsl.l, DANGER_TEXT_MAX_L) }));
}

function alphaOf(css: string, fallback: number): number {
  return parseColor(css)?.a ?? fallback;
}

function rgbOf(css: string): Rgba {
  return parseColor(css) ?? { r: 0, g: 0, b: 0, a: 1 };
}

/** The shipped ratio between a token and the token that tracks it. */
function shippedRatio(mode: ColorMode, lead: LiquiTokenName, follow: LiquiTokenName): number {
  const l = alphaOf(defaultTokens[mode][lead], 1);
  const f = alphaOf(defaultTokens[mode][follow], 1);
  return l === 0 ? 0 : f / l;
}

/**
 * `--lq-shadow` is two layers of one colour at two opacities, and the shipped
 * pair differs per mode — 0.35/0.18 on light, 0.55/0.35 on dark. The knob is a
 * multiplier over whichever pair the mode ships, so both modes read 1.00× until
 * someone moves them; measuring against a single hardcoded pair made dark open
 * at 1.57×.
 */
function shippedShadow(mode: ColorMode): { color: Rgba; near: number; far: number } {
  const layers = defaultTokens[mode].shadow.match(/rgba?\([^)]+\)/g) ?? [];
  const colors = layers.map((layer) => parseColor(layer)).filter((c): c is Rgba => c !== null);
  const fallback: Rgba = { r: 0, g: 0, b: 0, a: 1 };
  return {
    color: colors[0] ?? fallback,
    near: colors[0]?.a ?? 0.35,
    far: colors[1]?.a ?? 0.18,
  };
}

function formatShadow(mode: ColorMode, strength: number): string {
  const { color, near, far } = shippedShadow(mode);
  const layer = (offset: string, alpha: number) =>
    `${offset} ${formatRgba(withAlpha(color, alpha * strength))}`;
  return `${layer('0 24px 60px', near)}, ${layer('0 4px 14px', far)}`;
}

function readShadowStrength(css: string, mode: ColorMode): number {
  const match = /rgba?\([^)]+\)/.exec(css);
  const { near } = shippedShadow(mode);
  const alpha = match ? (parseColor(match[0])?.a ?? near) : near;
  return Math.round((alpha / near) * 100) / 100;
}

/* -------------------------------------------------------------------------- */
/* Knobs                                                                      */
/* -------------------------------------------------------------------------- */

export interface ColorKnob {
  id: string;
  kind: 'color';
  label: string;
  hint?: string;
  /** Writes the sibling mode too — brand colours shouldn't drift apart. */
  linked?: boolean;
  read: (tokens: LiquiTokens) => string;
  write: (tokens: LiquiTokens, value: string, mode: ColorMode) => Partial<LiquiTokens>;
}

export interface RangeKnob {
  id: string;
  kind: 'range';
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  read: (tokens: LiquiTokens, mode: ColorMode) => number;
  write: (tokens: LiquiTokens, value: number, mode: ColorMode) => Partial<LiquiTokens>;
}

export type ColorKnobSpec = ColorKnob | RangeKnob;

const percent = (value: number) => `${Math.round(value * 100)}%`;

export const COLOR_KNOBS: ColorKnobSpec[] = [
  {
    id: 'accent',
    kind: 'color',
    label: 'Accent',
    hint: 'buttons, focus, selection',
    linked: true,
    read: (t) => formatHex(rgbOf(t.accent)),
    write: (_t, value) => ({ accent: value }),
  },
  {
    id: 'danger',
    kind: 'color',
    label: 'Danger',
    hint: 'destructive fills and messages',
    linked: true,
    read: (t) => formatHex(rgbOf(t.danger)),
    write: (_t, value, mode) => ({ danger: value, 'danger-text': toDangerText(value, mode) }),
  },
  {
    id: 'text',
    kind: 'color',
    label: 'Text',
    hint: 'content on glass',
    read: (t) => formatHex(rgbOf(t.text)),
    write: (t, value) => {
      const rgb = rgbOf(value);
      return {
        text: formatRgba(withAlpha(rgb, alphaOf(t.text, 0.95))),
        'text-dim': formatRgba(withAlpha(rgb, alphaOf(t['text-dim'], 0.55))),
      };
    },
  },
  {
    id: 'tint-color',
    kind: 'color',
    label: 'Tint',
    hint: 'the colour of the glass itself',
    read: (t) => formatHex(rgbOf(t.tint)),
    write: (t, value) => {
      const rgb = rgbOf(value);
      return {
        tint: formatRgba(withAlpha(rgb, alphaOf(t.tint, 0.48))),
        'tint-deep': formatRgba(withAlpha(rgb, alphaOf(t['tint-deep'], 0.14))),
      };
    },
  },
  {
    id: 'tint-opacity',
    kind: 'range',
    label: 'Tint opacity',
    hint: 'legibility vs transparency',
    min: 0,
    max: 1,
    step: 0.01,
    format: percent,
    read: (t) => alphaOf(t.tint, 0.48),
    write: (t, value, mode) => ({
      tint: formatRgba(withAlpha(rgbOf(t.tint), value)),
      'tint-deep': formatRgba(
        withAlpha(rgbOf(t['tint-deep']), value * shippedRatio(mode, 'tint', 'tint-deep')),
      ),
    }),
  },
  {
    id: 'rim',
    kind: 'range',
    label: 'Rim light',
    hint: 'the bright edge',
    min: 0,
    max: 1,
    step: 0.01,
    format: percent,
    read: (t) => alphaOf(t['rim-hi'], 0.85),
    write: (t, value, mode) => ({
      'rim-hi': formatRgba(withAlpha(rgbOf(t['rim-hi']), value)),
      'rim-lo': formatRgba(
        withAlpha(rgbOf(t['rim-lo']), value * shippedRatio(mode, 'rim-hi', 'rim-lo')),
      ),
    }),
  },
  {
    id: 'highlight',
    kind: 'range',
    label: 'Highlight',
    hint: 'hover wash',
    min: 0,
    max: 1,
    step: 0.01,
    format: percent,
    read: (t) => alphaOf(t.highlight, 0.5),
    write: (t, value) => ({ highlight: formatRgba(withAlpha(rgbOf(t.highlight), value)) }),
  },
  {
    id: 'shadow',
    kind: 'range',
    label: 'Shadow',
    hint: 'elevated surfaces',
    min: 0,
    max: 2,
    step: 0.05,
    format: (v) => `${v.toFixed(2)}×`,
    read: (t, mode) => readShadowStrength(t.shadow, mode),
    write: (_t, value, mode) => ({ shadow: formatShadow(mode, value) }),
  },
  {
    id: 'scrim',
    kind: 'range',
    label: 'Scrim',
    hint: 'behind dialogs',
    min: 0,
    max: 1,
    step: 0.01,
    format: percent,
    read: (t) => alphaOf(t.scrim, 0.32),
    write: (t, value) => ({ scrim: formatRgba(withAlpha(rgbOf(t.scrim), value)) }),
  },
];

/* -------------------------------------------------------------------------- */
/* Glass dials                                                                */
/* -------------------------------------------------------------------------- */

export interface GlassDialSpec {
  key: keyof LiquiGlassTheme;
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  scale?: boolean;
}

/**
 * Split exactly as the theme type splits it: the first group is a default a
 * surface can override, the second is a multiplier on whatever the surface
 * asked for. The UI keeps them in separate sections because "0.35" and "1.4×"
 * answer different questions.
 */
export const GLASS_ABSOLUTE: GlassDialSpec[] = [
  { key: 'frost', label: 'Frost', hint: 'material density', min: 0, max: 1, step: 0.01 },
  { key: 'specular', label: 'Specular', hint: 'rim light', min: 0, max: 1, step: 0.01 },
  { key: 'saturation', label: 'Saturation', min: 1, max: 3, step: 0.05, unit: '×' },
  { key: 'dispersion', label: 'Dispersion', hint: '3× filter cost', min: 0, max: 1, step: 0.05 },
];

export const GLASS_SCALES: GlassDialSpec[] = [
  { key: 'radiusScale', label: 'Radius', min: 0.25, max: 2.5, step: 0.05, unit: '×', scale: true },
  {
    key: 'refractionScale',
    label: 'Refraction',
    min: 0,
    max: 2,
    step: 0.05,
    unit: '×',
    scale: true,
  },
  { key: 'bezelScale', label: 'Bezel', min: 0.4, max: 2.2, step: 0.05, unit: '×', scale: true },
  { key: 'blurScale', label: 'Blur', min: 0, max: 6, step: 0.1, unit: '×', scale: true },
];

/* -------------------------------------------------------------------------- */
/* Presets                                                                    */
/* -------------------------------------------------------------------------- */

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  /** Swatch colours for the preset chip: [accent, light tint, dark tint]. */
  swatch: [string, string, string];
  patch: ThemePatch;
}

export const PRESETS: ThemePreset[] = [
  {
    id: 'liqui',
    name: 'liqui',
    description: 'The shipped defaults.',
    swatch: ['#2f6bff', '#e8ecf5', '#1e202e'],
    patch: {},
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Colder, thinner glass with a hard rim.',
    swatch: ['#0aa5e9', '#f2f8ff', '#101a26'],
    patch: {
      glass: { frost: 0.22, specular: 0.85, saturation: 1.9, bezelScale: 1.15 },
      light: {
        accent: '#0aa5e9',
        tint: 'rgba(238, 248, 255, 0.42)',
        'tint-deep': 'rgba(238, 248, 255, 0.12)',
        'rim-hi': 'rgba(255, 255, 255, 0.95)',
        'rim-lo': 'rgba(255, 255, 255, 0.34)',
      },
      dark: {
        accent: '#5fcdff',
        tint: 'rgba(18, 30, 44, 0.6)',
        'tint-deep': 'rgba(10, 18, 28, 0.4)',
        'rim-hi': 'rgba(255, 255, 255, 0.58)',
      },
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Neutral and quiet. Reads well over photography.',
    swatch: ['#5b6472', '#eceef1', '#22262c'],
    patch: {
      glass: { frost: 0.45, specular: 0.5, saturation: 1.15 },
      light: {
        accent: '#5b6472',
        tint: 'rgba(246, 247, 249, 0.5)',
        'tint-deep': 'rgba(246, 247, 249, 0.16)',
        text: 'rgba(24, 26, 30, 0.95)',
        'text-dim': 'rgba(24, 26, 30, 0.55)',
      },
      dark: {
        accent: '#a5aeba',
        tint: 'rgba(34, 38, 44, 0.66)',
        'tint-deep': 'rgba(22, 25, 30, 0.44)',
      },
    },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Saturated and dispersive — a hero-surface theme.',
    swatch: ['#8b5cf6', '#f4efff', '#1b1430'],
    patch: {
      glass: { frost: 0.18, dispersion: 0.35, saturation: 2.3, refractionScale: 1.25 },
      light: {
        accent: '#8b5cf6',
        tint: 'rgba(250, 246, 255, 0.4)',
        'tint-deep': 'rgba(238, 228, 255, 0.14)',
      },
      dark: {
        accent: '#b794ff',
        tint: 'rgba(32, 22, 56, 0.58)',
        'tint-deep': 'rgba(20, 14, 38, 0.4)',
      },
    },
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'Dark glass in both modes, heavy shadow, minimal rim.',
    swatch: ['#e5c07b', '#2a2a2e', '#0d0d10'],
    patch: {
      glass: { frost: 0.55, specular: 0.4, saturation: 1.1, radiusScale: 0.8 },
      light: {
        accent: '#b07d18',
        text: 'rgba(250, 250, 252, 0.95)',
        'text-dim': 'rgba(250, 250, 252, 0.55)',
        tint: 'rgba(38, 38, 44, 0.55)',
        'tint-deep': 'rgba(20, 20, 24, 0.3)',
        'rim-hi': 'rgba(255, 255, 255, 0.34)',
        'rim-lo': 'rgba(255, 255, 255, 0.1)',
        highlight: 'rgba(255, 255, 255, 0.16)',
        shadow: '0 24px 60px rgba(0, 0, 0, 0.55), 0 4px 14px rgba(0, 0, 0, 0.3)',
      },
      dark: {
        accent: '#e5c07b',
        tint: 'rgba(16, 16, 20, 0.7)',
        'tint-deep': 'rgba(8, 8, 11, 0.5)',
        'rim-hi': 'rgba(255, 255, 255, 0.3)',
        'rim-lo': 'rgba(255, 255, 255, 0.08)',
        shadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 4px 14px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  {
    id: 'crystal',
    name: 'Crystal',
    description: 'Almost no tint. Needs a busy backdrop and a Chromium browser.',
    swatch: ['#12b981', '#ffffff', '#0c1414'],
    patch: {
      glass: {
        frost: 0.06,
        specular: 1,
        saturation: 1.4,
        refractionScale: 1.4,
        bezelScale: 1.3,
        blurScale: 0,
      },
      light: {
        accent: '#12b981',
        tint: 'rgba(255, 255, 255, 0.26)',
        'tint-deep': 'rgba(255, 255, 255, 0.06)',
        'rim-hi': 'rgba(255, 255, 255, 1)',
      },
      dark: {
        accent: '#4fe0ac',
        tint: 'rgba(20, 26, 30, 0.34)',
        'tint-deep': 'rgba(12, 16, 20, 0.2)',
        'rim-hi': 'rgba(255, 255, 255, 0.62)',
      },
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Patching, diffing, serialisation                                           */
/* -------------------------------------------------------------------------- */

export function applyPatch(patch: ThemePatch): LiquiTheme {
  return {
    glass: { ...defaultGlassTheme, ...patch.glass },
    light: { ...defaultTokens.light, ...patch.light },
    dark: { ...defaultTokens.dark, ...patch.dark },
  };
}

/** Only what the user actually moved — what gets stored, shared and exported. */
export function diffTheme(theme: LiquiTheme): ThemePatch {
  const patch: ThemePatch = {};

  const glass: Partial<LiquiGlassTheme> = {};
  for (const key of Object.keys(defaultGlassTheme) as (keyof LiquiGlassTheme)[]) {
    if (theme.glass[key] !== defaultGlassTheme[key]) {
      // Narrowing a union of value types through a generic key needs the cast;
      // the read above already proved the types line up.
      (glass as Record<string, unknown>)[key] = theme.glass[key];
    }
  }
  if (Object.keys(glass).length) patch.glass = glass;

  for (const mode of ['light', 'dark'] as const) {
    const tokens: Partial<LiquiTokens> = {};
    for (const name of LIQUI_TOKENS) {
      if (theme[mode][name] !== defaultTokens[mode][name]) tokens[name] = theme[mode][name];
    }
    if (Object.keys(tokens).length) patch[mode] = tokens;
  }

  return patch;
}

export function isDefaultTheme(theme: LiquiTheme): boolean {
  return Object.keys(diffTheme(theme)).length === 0;
}

/**
 * A share link carries the patch, not the theme: a URL that only says what
 * changed keeps working when a later liqui release retunes a default the sender
 * never touched.
 */
export function encodeTheme(theme: LiquiTheme): string {
  const json = JSON.stringify(diffTheme(theme));
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeTheme(encoded: string): LiquiTheme | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const patch = JSON.parse(new TextDecoder().decode(bytes)) as ThemePatch;
    return applyPatch(sanitisePatch(patch));
  } catch {
    return null;
  }
}

/**
 * A theme arrives from a URL or from localStorage written by an older build, so
 * it is untrusted input on its way into a `<style>` tag. Unknown keys are
 * dropped and every token value has to be something CSS would accept as a
 * colour or a shadow — no braces, no semicolons, nothing that could close the
 * declaration and open a rule of its own.
 */
const SAFE_VALUE = /^[#a-z0-9\s.,()%/-]+$/i;

export function sanitisePatch(patch: ThemePatch | null | undefined): ThemePatch {
  const out: ThemePatch = {};
  if (!patch || typeof patch !== 'object') return out;

  if (patch.glass && typeof patch.glass === 'object') {
    const glass: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(patch.glass)) {
      if (!(key in defaultGlassTheme)) continue;
      const shipped = defaultGlassTheme[key as keyof LiquiGlassTheme];
      if (typeof shipped === 'number' && typeof value === 'number' && Number.isFinite(value)) {
        glass[key] = value;
      } else if (typeof shipped === 'string' && typeof value === 'string') {
        glass[key] = value;
      }
    }
    if (Object.keys(glass).length) out.glass = glass as Partial<LiquiGlassTheme>;
  }

  for (const mode of ['light', 'dark'] as const) {
    const source = patch[mode];
    if (!source || typeof source !== 'object') continue;
    const tokens: Partial<LiquiTokens> = {};
    for (const name of LIQUI_TOKENS) {
      const value = source[name];
      if (typeof value === 'string' && value.length <= 200 && SAFE_VALUE.test(value)) {
        tokens[name] = value;
      }
    }
    if (Object.keys(tokens).length) out[mode] = tokens;
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

/** The block to paste into globals.css. Empty when nothing was changed. */
export function exportCss(theme: LiquiTheme): string {
  return themeCss(theme);
}

/** The provider call that carries the optics, which CSS can't. */
export function exportProvider(theme: LiquiTheme): string {
  const glass = diffTheme(theme).glass;
  if (!glass) return '';
  const lines = Object.entries(glass).map(
    ([key, value]) => `    ${key}: ${typeof value === 'string' ? `'${value}'` : value},`,
  );
  return [
    "import { LiquiThemeProvider } from '@liqui-design/glass';",
    '',
    'const theme = {',
    '  glass: {',
    ...lines,
    '  },',
    '};',
    '',
    'export function Providers({ children }: { children: React.ReactNode }) {',
    '  return <LiquiThemeProvider theme={theme}>{children}</LiquiThemeProvider>;',
    '}',
  ].join('\n');
}
