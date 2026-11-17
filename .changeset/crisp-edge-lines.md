---
'@liqui-design/glass': minor
---

The rim is redrawn against the system's own control center, measured off macOS 26 captures in both appearances.

- The edge shade is now a crisp line one device pixel wide at the boundary, instead of a soft band about two CSS pixels wide. Under `classic` it runs down the flanks and fades in round the corners as the highlight fades out; under `prism` it sits on the edges facing away from the light. `hairline` is drawn the same way.
- The `classic` highlight is a solid line about 1pt deep with a glow under it reaching about 4px (less on small controls), where the glow used to stop after a pixel or two.
- `prism` lights its key edge at the glass-type study's strength: it clips to full white instead of grading.
- The specular image is baked at the device pixel ratio, up to 2×, so a one-device-pixel line stays one device pixel.
- On the refraction tier the fallback CSS rim (`.liqui-glass__shine`) is hidden under `classic` too, as it already was under `prism`. Its bright left inset sat on top of the flank line and hid it. The frost and clear tiers keep it.
- `FINISH_LIGHTING.classic.edgeShade` is 0.8 and `FINISH_LIGHTING.prism.edgeShade` is 0.35, since the value is now the opacity of a one-pixel line. A theme that sets `edgeShade` itself will see a thinner, sharper edge at the same number.
