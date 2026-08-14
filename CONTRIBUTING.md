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

## Branches

```
feature/*  ──PR──> dev ──PR──> main ──auto──> production
hotfix/*   ──PR──> dev ──PR──> main ──auto──> production
```

`dev` and `main` are both protected and neither accepts a direct push. Everything
arrives through a pull request, including anything you write yourself.

- **`dev`** is where work lands. Branch from it, and open your PR back into it.
  Name the branch `feature/<what>`, or `hotfix/<what>` if you are fixing something
  that is already in production.
- **`main`** is production. It only ever receives a PR from `dev`, and merging one
  deploys the site and runs the release workflow.

A hotfix takes the same route as a feature. It is a separate prefix so the branch
list says which is which, not a shortcut past `dev` — skipping `dev` means the next
`dev` → `main` PR silently reverts the fix.

The default branch is `main`, so GitHub pre-fills `main` as the base for a new PR
and feature work is one dropdown away from going straight to production. The
**Branch policy** check fails any PR into `main` whose head is not `dev` or the
release branch changesets opens. If you see it go red, re-target the PR:

```bash
gh pr edit <number> --base dev
```

CI runs on every PR and again on `dev` and `main` after a merge, which is what
catches two PRs that passed separately and conflict together. Releases run from
`main` alone: merging to `main` opens a "Version Packages" PR, and merging *that*
publishes to npm.

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

   **Reference liqui's own items by full URL**, as the existing items do
   (`"https://liqui.design/r/liqui.json"`, not `"liqui"`). The shadcn CLI resolves a
   bare name against `ui.shadcn.com`, so `"button"` silently installs *shadcn's*
   button instead of ours. `"utils"` is the deliberate exception — shadcn's `cn` is
   byte-for-byte ours, and sharing it dedupes with whatever the consumer already has.

   Every `ui` item must depend on the `liqui` style item, because that is what writes
   the `--lq-*` tokens into the consumer's `globals.css`. Component sources read those
   tokens without fallbacks: omit it and `variant="accent"` renders as plain glass with
   no error anywhere.
4. Write `apps/www/content/docs/components/<name>.mdx` and add it to
   `content/docs/components/meta.json`. Render demos with
   `<ComponentPreview name="<name>-demo" />`.
5. `pnpm registry:build && pnpm dev:www` and look at it.
6. Add the demo to `apps/www/e2e/visual.spec.ts` and accept a baseline for it —
   see below.

Component pages should explain what is specific to putting *this* component on glass —
why the button is not a native `<button>`, why the field's input cannot be the glass
root. A restatement of Base UI's props is not worth writing.

## The two test suites

```bash
pnpm --filter www test:checks          # what CI runs
pnpm --filter www test:visual          # screenshots, compared to your baselines
pnpm --filter www test:visual:update   # accept the current render as the baseline
```

**`e2e/checks.spec.ts` is the CI gate.** Console errors on the pages that
exercise the awkward patterns, plus a couple of layout and filter-cache
invariants. Every one of them asserts something directly, so there is no
baseline to keep and nothing drifts when a browser updates.

**`e2e/visual.spec.ts` is a local tool and CI does not run it.** It keeps
baselines only for the platform you are on — the committed set is macOS
(`-chromium-darwin.png`), and if you work on Linux you will generate your own
`-chromium-linux.png` alongside them. Commit whichever set your machine
produces; neither is authoritative, because **visual acceptance here is a
person's job, not the suite's**. Baselines catch a change against the last
render somebody accepted; they cannot catch a render that was wrong from the
start, and twice now this repo has locked a defect into a green baseline. Use
the suite the way you would use `git diff`: run it before a change touching the
optics, run it after, look at what moved.

Do look. A green run means nothing *large* moved — the diff tolerance is sized
for the canvas's own run-to-run jitter and is wide enough to hide a whole
tooltip tail, which it has.

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

Open it against `dev`, not `main` — see [Branches](#branches). GitHub will offer
`main` as the base, so this is the one thing worth checking twice.

```bash
pnpm typecheck
pnpm build
pnpm --filter www test:checks
pnpm --filter @liqui-design/glass test:package   # publint + attw, if you touched the package
```

CI runs the same four. `test:package` catches exports-map and type-resolution breakage
that only surfaces in a consumer's project, where it is expensive to trace back.

Check your change in **both** Chromium and Safari. The fallback path is easy to break
without noticing, because everything still renders — just flatter.

## Reporting things

Bugs and component requests go in [issues](https://github.com/leefanv/liqui-design/issues).
For anything security-related, see [SECURITY.md](./SECURITY.md) — please don't open a
public issue.
