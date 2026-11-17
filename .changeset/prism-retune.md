---
'@liqui-design/glass': minor
---

The `prism` finish is retuned. Its key light now comes from above (`lightAngle: 1`, was `-33`). The edge facing away gets a stronger rim (`edgeShade: 0.48`) and the hairline is a little firmer (`hairline: 0.35`). `prismGlassTheme` moves from clear glass to lightly frosted cut glass with a colour fringe: `frost: 0.26`, `specular: 0.75`, `dispersion: 0.35`, `refractionScale: 88 / 150`, `bezelScale: 19 / 28` and `blurScale: 4.5`. The fallback rim on the frost and clear tiers now follows `lightAngle` through the new `--lq-light-x` / `--lq-light-y` properties, where it was fixed to a top-left light.
