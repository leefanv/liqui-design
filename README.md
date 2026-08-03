# liqui

Liquid-glass web UI components, built on [Base UI](https://base-ui.com/) headless primitives.
A project by [liquidglassdesign.com](https://liquidglassdesign.com/).

## Demo: Context Menu

```bash
npm install
npm run dev
```

Right-click anywhere on the desktop. Includes submenus, radio groups, checkbox
items, group labels, shortcuts, disabled and destructive items, and a
light/dark toggle in the dock.

For automated screenshots, `?autopen` opens the menu on load.

## How the glass works

`src/liqui/glass/LiquiGlass.tsx` is the base surface primitive. It layers:

1. **Refracting backdrop** — `backdrop-filter: url(#filter) blur() saturate()`
   where the SVG filter is an `feImage` displacement map fed into
   `feDisplacementMap`. The map is generated per-pixel on a canvas from a
   rounded-rect signed distance field; the refraction magnitude along the rim
   comes from a physically derived profile (surface height function + Snell's
   law, n = 1.5), precomputed into a small LUT. The center stays neutral (flat
   glass) while the `bezel`-wide rim samples toward the center, magnifying the
   backdrop like a convex lens edge.
2. **Tint** — a translucent gradient wash (theme-aware; strengthened
   automatically in the `clear` tier, which has no backdrop-filter).
3. **Specular rim** — inset shadows forming the top-left catch-light and the
   bottom rim.

The map is canvas-generated rather than an SVG data-URI because Chromium's
`feImage` rasterizes SVG images with CSS features (e.g. `mix-blend-mode`)
disabled, which silently corrupts gradient-composited maps.

### Configuration

The perf/quality trade-off is exposed to consumers via props:

- `material` — `'auto'` (refract where supported, frost elsewhere), `'frost'`
  (always blur-only, no SVG filter or canvas work), `'clear'` (tint + rim only,
  no backdrop-filter at all — cheapest).
- `profile` — rim lens shape: `'squircle'` (physical, default), `'convex'`
  (physical), `'rim'` (stylized quadratic falloff).
- `refraction` (px), `bezel` (px), `blur` (px), `saturation`.
- `dispersion` — chromatic aberration; `0` disables (single displacement
  pass). Values > 0 split R/G/B into three displacement passes (~3× filter
  cost), so keep it `0` where performance matters.

The demo's "Glass settings" panel drives all of these live; URL params
(`?material=frost&profile=rim&refraction=140&dispersion=0.2`) preset them.

### Browser support

True refraction requires `backdrop-filter` with SVG filter references —
Chromium today. Safari and Firefox automatically fall back to frosted glass.
WebKit has an implementation in review (bug 245510; PRs landed for review in
July 2026) — when Safari ships it, raise `SAFARI_REFRACTION_MIN` in
`LiquiGlass.tsx`. A standardization request for backdrop
displacement/refraction is open at w3c/svgwg#1142.

## Components

- `src/liqui/glass/` — `LiquiGlass` surface primitive + design tokens.
- `src/liqui/context-menu/` — styled Base UI ContextMenu: `Root`, `Trigger`,
  `Content`, `Item`, `CheckboxItem`, `RadioGroup`/`RadioItem`,
  `SubmenuRoot`/`SubmenuTrigger`/`SubmenuContent`, `Group`/`GroupLabel`,
  `Separator`, `Shortcut`.
