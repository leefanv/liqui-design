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
   automatically in the `clear` tier, which has no backdrop-filter). Kept
   near-transparent by default — the liquid look comes from refraction and
   light, not from frost.
3. **Specular rim light** — a canvas-rendered layer: a Gaussian band across
   the bezel × cosine-power falloff around two light positions (key light
   top-left, dim counter-light bottom-right), giving the arcs of light that
   make the rim read as polished glass. Positional azimuth, not surface-normal
   lighting: normals are constant along straight edges, which would light
   whole edges uniformly (bevel-button look). Controlled by the `specular`
   prop (0 disables; frost/clear tiers use cheap inset shadows instead).

Implementation gotchas learned the hard way:

- The maps are canvas-generated rather than SVG data-URIs because Chromium's
  `feImage` rasterizes SVG images with CSS features (e.g. `mix-blend-mode`)
  disabled, which silently corrupts gradient-composited maps.
- Surfaces are measured with ResizeObserver's `contentRect`, never
  `getBoundingClientRect()` — the popup opens under a `scale(0.85)` transition,
  and a transformed rect measured mid-animation would bake a permanently
  undersized (and never re-observed) map.

### Configuration

The perf/quality trade-off is exposed to consumers via props:

- `material` — `'auto'` (refract where supported, frost elsewhere), `'frost'`
  (always blur-only, no SVG filter or canvas work), `'clear'` (tint + rim only,
  no backdrop-filter at all — cheapest).
- `profile` — rim lens shape: `'squircle'` (physical, default), `'convex'`
  (physical), `'rim'` (stylized quadratic falloff).
- `refraction` (px), `bezel` (px), `blur` (px), `saturation`.
- `specular` — opacity of the rim-light layer (0 disables).
- `frost` — material density dial (0–1) mirroring Apple's Liquid Glass
  variants: 0 ≈ "clear" (transparent; Apple reserves it for media-rich
  backdrops with a dimming layer), 1 ≈ "regular" (adaptive frosted tint that
  carries legibility — Apple's default for menus and controls). Interpolates
  tint opacity and adds up to 14px blur. Default 0.35.

### Latency

Displacement/specular maps are cached module-wide by size+params (reopening a
popup is a lookup, not a render), generated at half resolution above ~180×180
(smooth fields — stretching is invisible), and the surface is measured
synchronously before first paint. While the map PNG decodes, the backdrop
runs the same blur so refraction fades in without a frost jump.
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
