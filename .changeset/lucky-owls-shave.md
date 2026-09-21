---
'@liqui-design/glass': minor
---

feat: two tokens for flat controls, `--lq-control` and `--lq-control-rim`

liqui's brand-coloured controls were glass that had been *retinted*: a checked
checkbox, a selected radio, a pressed toggle and an `accent` button all worked by
overriding `--lq-tint` with a mix of `--lq-accent`, so the accent arrived as a
lens and kept refracting the page through itself.

That is the wrong side of the line Apple draws, and the reason is not taste.
Glass is for a surface you act *through*; a solid fill is for a control that
carries a *value*. An accent tint is the second thing wearing the first: the
whole point of the colour is that it says "this is the one", and the whole point
of the lens is that it lets the wallpaper through. In practice it meant the
accent was one blue over a bright photograph and a different one over a dark
backdrop — a brand colour that changed with the desktop.

So those controls are now flat, and they need a resting surface that is not the
glass tint. The two tokens are it: `--lq-control` is the fill of a flat control
at rest, `--lq-control-rim` its hairline edge, dark on a light theme and light on
a dark one. They join the themeable set, so they reach `tokens.css`, the registry
`cssVars` block and the theme editor like every other token.

Nothing in the kernel changes: `LiquiGlass` renders exactly as before, and a
theme that does not mention the new tokens is unaffected.
