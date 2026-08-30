import * as React from 'react';
import type { GlassMaterial, GlassProfile } from './LiquiGlass';
import { DARK_SELECTOR, defaultTokens, LIQUI_TOKENS, type LiquiTokens } from './tokens';

export {
  DARK_SELECTOR,
  defaultTokens,
  LIQUI_TOKENS,
  type LiquiTokenName,
  type LiquiTokens,
} from './tokens';

/**
 * Global theming for liqui.
 *
 * A liqui surface is themed along two axes that behave nothing alike, and the
 * split below is the whole design:
 *
 * **Colour is CSS.** Every colour a surface paints comes from a `--lq-*`
 * custom property, so a theme can change all of it by writing twelve variables
 * — no React involved, and it keeps working inside portals, `::backdrop`, and
 * markup this library never sees.
 *
 * **Optics are JavaScript.** `refraction`, `bezel`, `radius` and `profile` feed
 * a canvas-generated displacement map and an SVG filter, so they can only be
 * props. And they are *per-component* props: a Button asks for
 * `refraction: 45, bezel: 11` while a Drawer asks for `150, 34`, because the
 * numbers scale with the surface. A global "set refraction to 150" would turn
 * every scrollbar thumb into a smear.
 *
 * So the two kinds of optical dial are themed differently:
 *
 * - **Absolute** (`material`, `profile`, `frost`, `specular`, `dispersion`,
 *   `saturation`) — the ones components mostly leave alone. The theme supplies
 *   the default; an explicit prop still wins.
 * - **Geometric** (`radius`, `refraction`, `bezel`, `blur`) — the ones every
 *   component sets for itself. The theme supplies a *multiplier*, so the
 *   proportions between a thumb and a drawer survive the edit.
 *
 * An untouched theme is a no-op by construction: every scale is 1, every
 * absolute matches `LiquiGlass`'s own default, and `themeCss` emits nothing
 * when no token differs. Mounting the provider changes no pixel.
 */

/* -------------------------------------------------------------------------- */
/* Optics                                                                     */
/* -------------------------------------------------------------------------- */

export interface LiquiGlassTheme {
  /** Rendering tier default. Surfaces that pass `material` still win. */
  material: GlassMaterial;
  /** Lens profile default. */
  profile: GlassProfile;
  /** Material density default, 0–1. */
  frost: number;
  /** Specular rim opacity default, 0–1. */
  specular: number;
  /** Chromatic aberration default. >0 costs ~3× filter work. */
  dispersion: number;
  /** Backdrop saturation default. */
  saturation: number;
  /** Multiplies each surface's own corner radius. */
  radiusScale: number;
  /** Multiplies each surface's own displacement scale. */
  refractionScale: number;
  /** Multiplies each surface's own bezel width. */
  bezelScale: number;
  /** Multiplies each surface's own base blur. */
  blurScale: number;
}

export const defaultGlassTheme: LiquiGlassTheme = {
  material: 'auto',
  profile: 'squircle',
  frost: 0.35,
  specular: 0.7,
  dispersion: 0,
  saturation: 1.7,
  radiusScale: 1,
  refractionScale: 1,
  bezelScale: 1,
  blurScale: 1,
};

/* -------------------------------------------------------------------------- */
/* Colour                                                                     */
/* -------------------------------------------------------------------------- */

export interface LiquiTheme {
  glass: LiquiGlassTheme;
  light: LiquiTokens;
  dark: LiquiTokens;
}

export const defaultTheme: LiquiTheme = {
  glass: defaultGlassTheme,
  light: defaultTokens.light,
  dark: defaultTokens.dark,
};

/**
 * Serialises the colour half of a theme to CSS, emitting only what differs from
 * the shipped tokens — an untouched theme produces the empty string, so
 * mounting a provider costs nothing and can't perturb anything.
 *
 * Both blocks are always emitted for the *union* of changed names, even when
 * only one mode was edited. `:root` and `[data-theme='dark']` have the same
 * specificity, so a `:root` override written after tokens.css would otherwise
 * beat that stylesheet's dark block and leak a light value into dark mode.
 * Re-asserting the dark value — customised or shipped — keeps the cascade
 * pinned regardless of which mode the edit happened in.
 */
export function themeCss(theme: Pick<LiquiTheme, 'light' | 'dark'>): string {
  const changed = LIQUI_TOKENS.filter(
    (name) =>
      theme.light[name] !== defaultTokens.light[name] ||
      theme.dark[name] !== defaultTokens.dark[name],
  );
  if (changed.length === 0) return '';

  const block = (selector: string, tokens: LiquiTokens) =>
    `${selector} {\n` +
    changed.map((name) => `  --lq-${name}: ${tokens[name]};`).join('\n') +
    '\n}';

  return `${block(':root', theme.light)}\n\n${block(DARK_SELECTOR, theme.dark)}\n`;
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

const GlassThemeContext = React.createContext<LiquiGlassTheme>(defaultGlassTheme);

/** Read by `LiquiGlass` to fill in the props a surface didn't set. */
export function useGlassTheme(): LiquiGlassTheme {
  return React.useContext(GlassThemeContext);
}

export interface LiquiThemeProviderProps {
  theme?: Partial<LiquiTheme>;
  /**
   * Set false to keep the provider to optics only — for an app whose `--lq-*`
   * values live in its own stylesheet and shouldn't be overridden at runtime.
   */
  injectTokens?: boolean;
  children?: React.ReactNode;
}

/**
 * Applies a theme to everything below it — and, for colour, to everything
 * *anywhere*, since the token block is written at `:root`. That is deliberate:
 * popups portal to `document.body`, outside any wrapper this provider could
 * put around its children, and a scoped wrapper would leave every menu, dialog
 * and tooltip on the old palette.
 *
 * The `<style>` is rendered inline rather than injected through an effect so
 * the server emits it too: a themed app would otherwise paint one frame of the
 * shipped palette before hydration.
 */
export function LiquiThemeProvider({
  theme,
  injectTokens = true,
  children,
}: LiquiThemeProviderProps) {
  const glass = React.useMemo(
    () => (theme?.glass ? { ...defaultGlassTheme, ...theme.glass } : defaultGlassTheme),
    [theme?.glass],
  );

  const css = React.useMemo(() => {
    if (!injectTokens) return '';
    return themeCss({
      light: { ...defaultTokens.light, ...theme?.light },
      dark: { ...defaultTokens.dark, ...theme?.dark },
    });
  }, [injectTokens, theme?.light, theme?.dark]);

  return (
    <GlassThemeContext.Provider value={glass}>
      {/* Ternary rather than `css && …`: an empty string is falsy but React
          still renders it, leaving a stray text node in the tree. */}
      {css ? <style data-liqui-theme="">{css}</style> : null}
      {children}
    </GlassThemeContext.Provider>
  );
}
