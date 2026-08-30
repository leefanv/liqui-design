---
'@liqui-design/glass': minor
---

Add `LiquiThemeProvider` — global theming for the optics and the tokens.

Colour was already themeable: every surface paints from a `--lq-*` custom
property, so twelve variables in a stylesheet re-skin the library. The optics
were not. `refraction`, `bezel`, `radius` and `profile` feed a canvas-generated
displacement map and an SVG filter, so they can only be props — and they are
*per-component* props, set to values scaled to each surface: a scroll-area thumb
asks for `bezel: 4`, a drawer for `34`. There was no way to say "make all the
glass thicker" without editing every component.

The provider splits the dials the way they actually behave:

- **Absolute defaults** — `material`, `profile`, `frost`, `specular`,
  `dispersion`, `saturation`. The theme supplies the value a surface didn't;
  an explicit prop still wins, so a component that asks for `frost: 0.6`
  because its design needs it keeps it.
- **Multipliers** — `radiusScale`, `refractionScale`, `bezelScale`,
  `blurScale`. These apply to whatever each surface asked for, so the
  proportion between a thumb and a drawer survives the edit.

`theme.light` and `theme.dark` accept the twelve tokens as well, written into a
`<style>` at `:root` for themes that change at runtime. Portals are why it is
`:root` and not a wrapper: a popup mounts on `document.body`, outside anything
the provider could wrap.

An untouched theme is a no-op by construction — every multiplier is 1, every
absolute equals the existing default, and no `<style>` is emitted until a token
differs. Mounting the provider changes no pixel.

Also: the scaled geometry is rounded before it reaches the displacement-map and
filter caches. Those are keyed on size and optics, so an unrounded multiplier
being dragged would mint a fresh canvas render and a `<filter>` node per frame.
And `bezel` now floors at 1px — a zero-width bezel divides through in the map
generator and turns the whole surface into NaN displacement.

`tokens.css` is now generated at build time from `src/tokens.ts`, which is where
the token values live. The stylesheet is byte-identical for the same values;
what changes is that there is one copy of them instead of two.
