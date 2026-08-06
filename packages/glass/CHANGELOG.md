# @liqui-design/glass

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
