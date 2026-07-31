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
   rounded-rect signed distance field: the center stays neutral (flat glass)
   while a `bezel`-wide rim samples toward the center with an eased profile,
   magnifying the backdrop like a convex lens edge.
2. **Tint** — a translucent gradient wash (theme-aware).
3. **Specular rim** — inset shadows forming the top-left catch-light and the
   bottom rim.

The map is canvas-generated rather than an SVG data-URI because Chromium's
`feImage` rasterizes SVG images with CSS features (e.g. `mix-blend-mode`)
disabled, which silently corrupts gradient-composited maps.

### Browser support

True refraction requires `backdrop-filter` with SVG filter references
(Chromium). Safari and Firefox automatically fall back to frosted glass
(stronger blur + saturation) — detection lives in `LiquiGlass.tsx`.

## Components

- `src/liqui/glass/` — `LiquiGlass` surface primitive + design tokens.
- `src/liqui/context-menu/` — styled Base UI ContextMenu: `Root`, `Trigger`,
  `Content`, `Item`, `CheckboxItem`, `RadioGroup`/`RadioItem`,
  `SubmenuRoot`/`SubmenuTrigger`/`SubmenuContent`, `Group`/`GroupLabel`,
  `Separator`, `Shortcut`.
