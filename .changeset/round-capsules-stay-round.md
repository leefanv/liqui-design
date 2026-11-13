---
'@liqui-design/glass': patch
---

Capsules and discs keep round corners. Since 0.5.0, every surface has been
drawn with `corner-shape: squircle`, and a superellipse cannot close into a
semicircle: at a radius of half the short side it draws a bulging rounded
rectangle instead. Pill-shaped and circular glass, such as avatars, meter and
progress tracks, scrollbar thumbs, tab bars and tooltips, read as slightly
square. A surface whose radius reaches half its short side now renders with
round corners, skips the squircle radius compensation, and generates its
displacement map and lighting on circular corners to match. Everything else
keeps its continuous corners. The flag is a non-inheriting custom property,
so glass nested inside a capsule is unaffected.
