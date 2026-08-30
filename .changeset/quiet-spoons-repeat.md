---
'@liqui-design/glass': patch
---

Give the forwarded ref a stable imperative handle.

`useImperativeHandle` was called without a dependency array, so it re-ran on
every render — detaching the previous handle and attaching a new one each time.
When the forwarded ref is a *callback* ref, detaching means calling it with
`null`.

Base UI hands exactly such a callback ref to any part belonging to a composite
list — a slider thumb, a tab, a menu item — and its cleanup unregisters the item
and schedules a state update. Render, detach, unregister, render: an infinite
loop, from a component that is only sitting on the page. Base UI 1.7 is where
that unregister path began scheduling the update, so that is where it surfaced,
but the unstable handle was the defect the whole time.

The handle is a getter over a ref that outlives every render, so it depends on
nothing and is now created once.
