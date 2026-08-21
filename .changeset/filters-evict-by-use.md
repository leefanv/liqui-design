---
'@liqui-design/glass': patch
---

Evict filters by least-recently-used, not by age.

`ensureFilter` returned early on a cache hit without re-inserting the key, so
the registry's `Map` stayed in creation order and eviction removed the oldest
filter rather than the coldest one. Under the 128-entry cap that was mostly
invisible, because a page rarely held that many surfaces at once.

It stops being invisible on a full page of glass. Every surface re-requests on
every frame of a window resize — `ResizeObserver` fires unthrottled — so a
dozen surfaces walk through hundreds of sizes in a couple of seconds and push
the filters that are actually on screen out of the registry. The `<filter>` node
gets removed, the surface's `url(#…)` resolves to nothing, and Chromium drops
the whole `backdrop-filter` chain. It never comes back: the reference is
memoised on size and optics, and neither of those changed, so nothing re-asks.
The surface just stops refracting, with nothing logged.

The hit path now re-inserts, which is what the surrounding comment already
claimed it did, and the cap moves to 256.
