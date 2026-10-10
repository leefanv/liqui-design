---
'@liqui-design/glass': minor
---

Rework the surface optics toward the reference material look:

- Specular rim is now lit from the outline normal — a crisp ~1px stroke plus
  a few px of diffuse glow on the top/bottom arcs, with a hairline shade on
  the side flanks — instead of the positional-azimuth band, which lit
  straight edges unevenly. It renders at full resolution, with a baked dark
  variant that CSS swaps in under `[data-theme='dark']`/`.dark`.
- The refraction filter gains a tone stage (`feComponentTransfer` lookup
  table) that lifts the darkest backdrop tones and rolls off the brightest,
  scaled down as `frost` rises, so refracted content stays in a band the
  foreground keeps contrast against.
- Corners are continuous: the displacement map and lighting are generated on
  a superellipse (|x|⁴+|y|⁴=r⁴) and the surface declares CSS
  `corner-shape: squircle` (Chromium 139+), so optics and clip agree on one
  geometry. Browsers without the property keep round corners.
