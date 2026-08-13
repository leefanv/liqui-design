---
'@liqui-design/glass': patch
---

Let utility classes override a surface's base `position`, `border-radius`,
`isolation` and `color`.

Those four are defaults, but they were shipped as unlayered rules, and an
unlayered rule outranks *any* layered one no matter how specific — so Tailwind
utilities on a glass surface lost silently. `fixed` on a glass dialog stayed
`relative`, leaving the popup wherever the document flow put it instead of
centred on the viewport, and `text-white` on an accent button never replaced
`--lq-text`. Neither logged anything; both looked like the component had been
styled that way on purpose.

They now live in Tailwind's own `base` layer, which is declared before
`utilities`, so an override wins. With no Tailwind present the layer is created
by this file and any unlayered consumer CSS beats it — which is what a default
should do. The surface anatomy (the backdrop, tint, specular and content layers)
stays unlayered: nothing outside should be overriding that.
