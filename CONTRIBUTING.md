# Contributing to liqui

Thanks for taking a look. This document covers running the repo, the shape of it, and
the handful of rules that are specific to working on glass.

## Setup

Requires **Node 20+** and **pnpm** (the version is pinned in `packageManager`; run
`corepack enable` if you don't have it).

```bash
git clone https://github.com/leefanv/liqui-design.git
cd liqui-design
pnpm install
```

## Layout

```
packages/glass    @liqui-design/glass — the refraction kernel, the only published package
apps/www          documentation site (Next + Fumadocs) and the registry the CLI serves
apps/playground   Vite app for tuning optics against a real backdrop
```

## Two dev loops

**Working on the optics** — the playground puts surfaces over a real desktop wallpaper
with a live control panel, which is the only honest way to judge refraction:

```bash
pnpm dev:playground
```

It aliases `@liqui-design/glass` at the kernel's *source*, so filter changes hot-reload
without a build step.

**Working on components or docs** — the docs site renders every component from the
registry:

```bash
pnpm dev:www          # http://localhost:4000
```

`pnpm dev:www` runs `registry:build` first, which regenerates `public/r/*.json` (what
the CLI installs) and `registry/__index__.tsx` + `__sources__.ts` (what the docs preview
renders). Both come from `registry.json`, so a demo can never drift from the code that
ships.

## Adding a component

1. Write it in `apps/www/registry/liqui/ui/<name>.tsx`. Import the kernel from
   `@liqui-design/glass` and `cn` from `@/lib/utils` — that is where the CLI puts it in
   a consumer project, and the same file has to compile in both places.
2. Add at least one demo in `apps/www/registry/liqui/examples/<name>-demo.tsx` with a
   default export.
3. Register both in `apps/www/registry.json`. The `ui` item needs `dependencies`,
   `registryDependencies` and a `target`; the example needs `registryDependencies`
   pointing at the component.
4. Write `apps/www/content/docs/components/<name>.mdx` and add it to
   `content/docs/components/meta.json`. Render demos with
   `<ComponentPreview name="<name>-demo" />`.
5. `pnpm registry:build && pnpm dev:www` and look at it.

Component pages should explain what is specific to putting *this* component on glass —
why the button is not a native `<button>`, why the field's input cannot be the glass
root. A restatement of Base UI's props is not worth writing.

## Rules that are specific to glass

These are all things that were debugged the hard way. Breaking them produces effects
that look like "the glass is just weak", with no error anywhere.

- **Never measure a surface with `getBoundingClientRect`.** Popups open under a
  `scale()` transition, and a rect measured mid-animation bakes a permanently
  undersized displacement map that nothing re-fires to correct. Use `ResizeObserver`
  `contentRect` and `offsetWidth` — both are layout sizes, immune to transforms.
- **Never build the displacement map as an SVG data URI.** Chromium rasterises
  `feImage` SVG sources with CSS features disabled: `mix-blend-mode` and modern `hsl()`
  silently do nothing, corrupting the map into a full-surface smear. Generate it on a
  canvas.
- **Never put blur in the same `backdrop-filter` chain as the SVG filter.** While
  `feImage` decodes, Chromium treats the entire chain as inert, so even the base blur
  arrives late. Blur and displacement live on separate stacked layers.
- **Don't render previews in an iframe.** The refraction filters live in one
  document-wide `<svg>` registry; an iframe is a separate document, so every `url(#…)`
  inside it resolves to nothing and the surface silently falls back to frosted blur.
- **Bezel is a fraction of the box, so small components need smaller numbers.** The
  checkbox runs `refraction: 20 / bezel: 6` against a menu popup's `150 / 28`. If you
  raise the dials globally, the checkbox smears first — it is a useful canary.
- **Retint with `--lq-tint`, don't paint a background.** A background covers the
  refraction; overriding the token keeps the lens working through the accent colour.

## Changesets

Any change to `packages/glass` needs a changeset. Nothing else does — the registry
components ship as source and are not versioned.

```bash
pnpm changeset
```

Describe the change for someone who will read it in a changelog six months from now,
and say *why* where it isn't obvious. Releases are automated: merging to `main` opens a
"Version Packages" PR, and merging that publishes.

## Before opening a PR

```bash
pnpm typecheck
pnpm build
pnpm --filter @liqui-design/glass test:package   # publint + attw, if you touched the package
```

CI runs the same three. `test:package` catches exports-map and type-resolution breakage
that only surfaces in a consumer's project, where it is expensive to trace back.

Check your change in **both** Chromium and Safari. The fallback path is easy to break
without noticing, because everything still renders — just flatter.

## Reporting things

Bugs and component requests go in [issues](https://github.com/leefanv/liqui-design/issues).
For anything security-related, see [SECURITY.md](./SECURITY.md) — please don't open a
public issue.
