import type { LiquiGlassProps } from '@liqui-design/glass';

/**
 * What a control looks like when it is sitting on one of the page's panels.
 *
 * `backdrop-filter` samples what is painted behind the element, and behind
 * anything inside a panel is the panel. So a control there cannot be a lens —
 * it would only bend the surface it is lying on — and the library's answer is
 * to give the lens up explicitly rather than let it go muddy: `clear` is the
 * cheapest tier, tint and rim with no backdrop filter at all.
 *
 * The retint is the other half, and it is the part that is easy to miss. The
 * default tint assumes a page behind it, so in dark mode it is a dark wash —
 * correct over a bright backdrop, and a black blot when the thing behind it is
 * already a dark panel. A control on a panel has to read as an object raised
 * off it, which means light, not dark. Switches are the exception and keep the
 * default: their accent is their state, and it is dense enough to carry.
 */
export const ON_PANEL = { material: 'clear' } satisfies Partial<LiquiGlassProps>;

/** A surface on a panel: a pane of light rather than a hole. */
export const ON_PANEL_TINT =
  '[--lq-tint:color-mix(in_srgb,white_26%,transparent)] [--lq-tint-deep:color-mix(in_srgb,white_11%,transparent)]';

/**
 * A knob on a panel. Denser than a pane, because a slider thumb reads as a
 * solid object — the same call Switch makes when it keeps its own thumb opaque.
 */
export const ON_PANEL_KNOB =
  '[--lq-tint:color-mix(in_srgb,white_88%,transparent)] [--lq-tint-deep:color-mix(in_srgb,white_66%,transparent)]';
