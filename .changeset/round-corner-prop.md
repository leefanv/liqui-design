---
'@liqui-design/glass': minor
---

`LiquiGlass` takes `corner: 'squircle' | 'round'`. `squircle` is the default and unchanged. `round` draws a plain circular arc at exactly `radius`, with no squircle compensation, and the displacement map, the lighting and the published `--lq-corner` follow it. It is for surfaces the system itself draws with round corners, like the control center's wide slider modules. A capsule or a disc is round either way.
