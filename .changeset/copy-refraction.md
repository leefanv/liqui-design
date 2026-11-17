---
'@liqui-design/glass': minor
---

Refraction in Safari and Firefox, and the baked rim on every tier.

- New `LiquiBackdrop`: a positioned box that paints `backdrop` behind its children. Where `backdrop-filter` cannot carry an SVG filter (Safari, Firefox), every `LiquiGlass` inside the box refracts a copy of that backdrop instead, lined up with the original: blurred, saturated and brightened by a CSS filter on the GPU, then displaced and toned by the same SVG filter on its own content. Chromium is unchanged and keeps refracting the real page. A surface nested in another surface, or portalled out of the box, stays on frost. Pass `revision` when something in the box moves by a transform.
- The baked specular (highlight, edge line, hairline) is drawn on the frost tier too, Safari and Firefox included, in place of the CSS fallback shine. `material="frost"` gets it as well. The CSS shine remains on the clear tier only.
