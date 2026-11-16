---
'@liqui-design/glass': minor
---

Continuous corners, one mechanism for the whole library.

- Every surface now publishes its drawn corner as `--lq-radius` and its shape as `--lq-corner` (`squircle`, or `round` on a capsule), and the content layer takes both, so a hover wash or a fill painted on it meets the edge on the same curve.
- New classes in `styles.css`: `lq-nest` (a container: `[--lq-inset]` and `[--lq-item-h]`) publishes `--lq-item-radius` for what sits in it — concentric with the surface, and a capsule once that reaches half the item's height; `lq-corner` puts an item on that shape; `lq-squircle` (`[--lq-r]`, `[--lq-h]`) gives a box with a corner of its own the same treatment a surface gets.
- A surface is drawn as a true capsule once its radius *as drawn* — 1.4× where the squircle renders — reaches half its short side, instead of a clamped squircle that bulged at the ends.
- `LiquiThemeProvider` writes the theme's `radiusScale` to `--lq-radius-scale`, so corners drawn in CSS follow the same dial as the surfaces.
- `--lq-corner-shape` is gone; it was internal and is replaced by `--lq-corner`.
