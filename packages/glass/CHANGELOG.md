# @liqui-design/glass

## 0.3.0

### Minor Changes

- 60a3550: Add `LiquiThemeProvider` — global theming for the optics and the tokens.

  Colour was already themeable: every surface paints from a `--lq-*` custom
  property, so twelve variables in a stylesheet re-skin the library. The optics
  were not. `refraction`, `bezel`, `radius` and `profile` feed a canvas-generated
  displacement map and an SVG filter, so they can only be props — and they are
  _per-component_ props, set to values scaled to each surface: a scroll-area thumb
  asks for `bezel: 4`, a drawer for `34`. There was no way to say "make all the
  glass thicker" without editing every component.

  The provider splits the dials the way they actually behave:

  - **Absolute defaults** — `material`, `profile`, `frost`, `specular`,
    `dispersion`, `saturation`. The theme supplies the value a surface didn't;
    an explicit prop still wins, so a component that asks for `frost: 0.6`
    because its design needs it keeps it.
  - **Multipliers** — `radiusScale`, `refractionScale`, `bezelScale`,
    `blurScale`. These apply to whatever each surface asked for, so the
    proportion between a thumb and a drawer survives the edit.

  `theme.light` and `theme.dark` accept the twelve tokens as well, written into a
  `<style>` at `:root` for themes that change at runtime. Portals are why it is
  `:root` and not a wrapper: a popup mounts on `document.body`, outside anything
  the provider could wrap.

  An untouched theme is a no-op by construction — every multiplier is 1, every
  absolute equals the existing default, and no `<style>` is emitted until a token
  differs. Mounting the provider changes no pixel.

  Also: the scaled geometry is rounded before it reaches the displacement-map and
  filter caches. Those are keyed on size and optics, so an unrounded multiplier
  being dragged would mint a fresh canvas render and a `<filter>` node per frame.
  And `bezel` now floors at 1px — a zero-width bezel divides through in the map
  generator and turns the whole surface into NaN displacement.

  `tokens.css` is now generated at build time from `src/tokens.ts`, which is where
  the token values live. The stylesheet is byte-identical for the same values;
  what changes is that there is one copy of them instead of two.

## 0.2.4

### Patch Changes

- d2af2cf: Give the forwarded ref a stable imperative handle.

  `useImperativeHandle` was called without a dependency array, so it re-ran on
  every render — detaching the previous handle and attaching a new one each time.
  When the forwarded ref is a _callback_ ref, detaching means calling it with
  `null`.

  Base UI hands exactly such a callback ref to any part belonging to a composite
  list — a slider thumb, a tab, a menu item — and its cleanup unregisters the item
  and schedules a state update. Render, detach, unregister, render: an infinite
  loop, from a component that is only sitting on the page. Base UI 1.7 is where
  that unregister path began scheduling the update, so that is where it surfaced,
  but the unstable handle was the defect the whole time.

  The handle is a getter over a ref that outlives every render, so it depends on
  nothing and is now created once.

## 0.2.3

### Patch Changes

- 5c00b41: Evict filters by least-recently-used, not by age.

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

## 0.2.2

### Patch Changes

- 3bd20fa: Keep component retints working on the `clear` material.

  The clear tier used to reach legibility by overriding `--lq-tint` on the surface
  itself. That override won against anything a component set on the same element:
  a checked Checkbox or Switch writes its accent from a Tailwind utility, utilities
  are layered, and layered rules lose to this package's unlayered stylesheet. So
  `material="clear"` silently turned every checked control back into a neutral
  white track — an on/off switch that could not show "on", with nothing logged
  anywhere.

  The tier now composites a neutral wash _underneath_ whatever tint is in play
  instead of replacing it. Densities are unchanged for surfaces that don't retint;
  retinted ones now come through in their own colour. This matters most for
  controls nested on another glass surface, where `clear` is the recommended way to
  give up a lens they can't use.

- 3bd20fa: Let utility classes override a surface's base `position`, `border-radius`,
  `isolation` and `color`.

  Those four are defaults, but they were shipped as unlayered rules, and an
  unlayered rule outranks _any_ layered one no matter how specific — so Tailwind
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

## 0.2.1

### Patch Changes

- c47ca4b: Add `author` and `bugs` to the package manifest, so npm links back to the
  issue tracker now that the repository is public.

  This release also exercises the automated publish path for the first time.
  0.2.0 was pushed by hand before trusted publishing could be configured — npm
  requires a package to exist before you can name a trusted publisher for it — so
  this is the first version whose provenance is attested.

## 0.2.0

### Minor Changes

- Add `contentClassName`, fix an SSR hydration mismatch, and extend the token set.

  - **`contentClassName`** hands the content wrapper to the component built on the
    glass. Without it, styling padding or layout from outside required a
    descendant selector (`[&>.liqui-glass__content]:…`), which utility classes
    express badly.
  - **SSR hydration.** `supportsRefraction` sniffs the UA, so it was false during
    SSR and true in Chromium — the server emitted the frost tier and the client's
    first render emitted the refract tier, a mismatch React won't patch up. The
    tier now starts where the server can also land and upgrades in a layout
    effect, which runs after hydration commits but before paint, so there is no
    visible frost flash.
  - **New tokens:** `--lq-danger`, `--lq-danger-text` and `--lq-scrim`, so
    components no longer need hard-coded reds or a `dark:` variant to theme
    destructive states and modal scrims.
