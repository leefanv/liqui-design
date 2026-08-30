/**
 * The colour arithmetic the theme editor needs, and nothing else.
 *
 * No library: the whole requirement is parsing the two notations liqui's tokens
 * are written in (`#rrggbb` and `rgba()`), moving lightness around, and writing
 * the result back in *exactly* the notation it came in. That last part is why
 * this is hand-rolled — a colour library normalises, and normalising
 * `rgba(255, 255, 255, 0.5)` into `#ffffff80` would make every untouched token
 * read as changed and defeat the editor's "an unedited theme emits nothing"
 * guarantee.
 */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Trims float noise without turning 0.5 into 0.50 or 1 into 1.0. */
function num(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

export function parseColor(css: string): Rgba | null {
  const text = css.trim();

  const hex = /^#([0-9a-f]{3,8})$/i.exec(text);
  if (hex) {
    const d = hex[1];
    const expand = (s: string) => parseInt(s.length === 1 ? s + s : s, 16);
    if (d.length === 3 || d.length === 4) {
      return {
        r: expand(d[0]),
        g: expand(d[1]),
        b: expand(d[2]),
        a: d.length === 4 ? expand(d[3]) / 255 : 1,
      };
    }
    if (d.length === 6 || d.length === 8) {
      return {
        r: parseInt(d.slice(0, 2), 16),
        g: parseInt(d.slice(2, 4), 16),
        b: parseInt(d.slice(4, 6), 16),
        a: d.length === 8 ? parseInt(d.slice(6, 8), 16) / 255 : 1,
      };
    }
    return null;
  }

  const fn = /^rgba?\(([^)]+)\)$/i.exec(text);
  if (fn) {
    // Accepts both the legacy comma form and the space form with a `/` alpha.
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }

  return null;
}

export function formatRgba({ r, g, b, a }: Rgba): string {
  const channels = [r, g, b].map((c) => Math.round(clamp(c, 0, 255))).join(', ');
  return `rgba(${channels}, ${num(clamp(a, 0, 1))})`;
}

export function formatHex({ r, g, b }: Rgba): string {
  const channel = (c: number) =>
    Math.round(clamp(c, 0, 255))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear blend in sRGB. `amount` is how much of `b` ends up in the result. */
export function mix(a: Rgba, b: Rgba, amount: number): Rgba {
  const t = clamp(amount, 0, 1);
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
    a: a.a + (b.a - a.a) * t,
  };
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
  a: number;
}

export function rgbToHsl({ r, g, b, a }: Rgba): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l, a };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l, a };
}

export function hslToRgb({ h, s, l, a }: Hsl): Rgba {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = l - c / 2;
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255, a };
}

/** Replaces a colour's alpha, keeping its channels. */
export function withAlpha(color: Rgba, a: number): Rgba {
  return { ...color, a: clamp(a, 0, 1) };
}

/**
 * WCAG relative luminance — used to decide whether a picked accent wants white
 * or near-black text on top of it.
 */
export function luminance({ r, g, b }: Rgba): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
