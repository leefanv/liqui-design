# @liqui-design/glass

The refraction kernel behind [liqui](https://liqui.design) — the part of the
liquid-glass material that is algorithm and browser-compatibility work rather
than styling.

You usually don't install this directly. `npx shadcn@latest add @liqui/button`
pulls it in as a dependency and writes the component source into your project,
which is the part you're meant to edit. This package is the part you aren't.

```bash
npm i @liqui-design/glass
```

## What's in it

- **`LiquiGlass`** — the surface primitive. Four stacked layers (blur backdrop,
  displacement backdrop, tint, specular rim) plus a content wrapper.
- **A canvas displacement-map generator** — rounded-rect SDF with eased rim
  sampling *toward* the centre, which is what produces convex-lens edge
  magnification instead of a smear.
- **A document-wide SVG filter registry** — filters are hoisted into one
  persistent hidden `<svg>` and LRU-capped, so a remounted surface references an
  already-decoded filter and refracts on its first frame.
- **Browser detection and fallback** — refraction renders in Chromium; Safari
  and Firefox drop `backdrop-filter` entirely when it references an SVG filter,
  and fall back to frosted blur automatically.

## Usage

```tsx
import { LiquiGlass } from '@liqui-design/glass';
import '@liqui-design/glass/tokens.css'; // or supply your own --lq-* values

<LiquiGlass radius={16} refraction={140} bezel={26} frost={0.35}>
  <div className="p-4">Anything</div>
</LiquiGlass>;
```

The anatomy stylesheet is imported by the component itself, so there is nothing
else to wire up. `tokens.css` is optional — every rule carries a fallback — but
without it you get the light-theme defaults only.

### Props

| Prop | Default | |
| --- | --- | --- |
| `material` | `'auto'` | `auto` refracts where supported, frosts elsewhere. `frost` and `clear` force a tier. |
| `frost` | `0.35` | Material density, 0–1. `0` ≈ Apple's *clear*, `1` ≈ *regular*. |
| `refraction` | `140` | Displacement scale — how hard the rim bends. |
| `bezel` | `26` | Width of the refracting rim in px. |
| `radius` | `16` | Corner radius; also shapes the displacement map. |
| `blur` | `1` | Base backdrop blur. `frost` adds up to 14px on top. |
| `dispersion` | `0` | Chromatic aberration. Costs ~3× filter work. |
| `specular` | `0.7` | Rim-light opacity. |
| `elevated` | `false` | Raises the drop shadow. |
| `contentClassName` | — | Classes for the content wrapper above every glass layer. |

## Two things worth knowing

**Glass needs something to refract.** A surface on a flat fill shows you the
flat fill. Put it over imagery, video, or a gradient with real edges.

**Sizes are measured with `ResizeObserver` `contentRect`, never
`getBoundingClientRect`.** Popups open under a `scale()` transition, and a rect
measured mid-animation bakes a permanently undersized map that nothing re-fires
to correct. If you fork this, keep that.

Full material guide: <https://liqui.design/docs/handbook/glass>

## License

MIT
