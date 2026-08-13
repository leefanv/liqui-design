---
'@liqui-design/glass': patch
---

Keep component retints working on the `clear` material.

The clear tier used to reach legibility by overriding `--lq-tint` on the surface
itself. That override won against anything a component set on the same element:
a checked Checkbox or Switch writes its accent from a Tailwind utility, utilities
are layered, and layered rules lose to this package's unlayered stylesheet. So
`material="clear"` silently turned every checked control back into a neutral
white track — an on/off switch that could not show "on", with nothing logged
anywhere.

The tier now composites a neutral wash *underneath* whatever tint is in play
instead of replacing it. Densities are unchanged for surfaces that don't retint;
retinted ones now come through in their own colour. This matters most for
controls nested on another glass surface, where `clear` is the recommended way to
give up a lens they can't use.
