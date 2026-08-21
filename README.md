<div align="center">

<img src="./apps/www/app/logo.svg" alt="" width="88" height="88">

# Liqui Design

**Liquid glass components for React, built on [Base UI](https://base-ui.com).**

Surfaces that actually refract what is behind them, using a canvas-generated
displacement map and an SVG filter instead of a blur with a white overlay.

English · [简体中文](./README.zh-CN.md)

[Documentation](https://liqui.design) · [Glass handbook](https://liqui.design/docs/handbook/glass) · [Components](https://liqui.design/docs/components/button) · [Gallery](https://liquidglassdesign.com/?ref=liqui.design)

[![npm](https://img.shields.io/npm/v/@liqui-design/glass?color=%232f6bff&label=%40liqui-design%2Fglass)](https://www.npmjs.com/package/@liqui-design/glass)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

</div>

---

## Install

```bash
npx shadcn@latest add https://liqui.design/r/button.json
```

That writes `components/ui/button.tsx` into your project, adds the glass design
tokens to your `globals.css`, and installs the `@liqui-design/glass` package.

If you plan to add more than one component, register the namespace once in your
`components.json`:

```json
{
  "registries": {
    "@liqui-design": "https://liqui.design/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @liqui-design/button
```

> `@liqui-design/button` is a registry item, not an npm package. The namespace is
> a key in your own `components.json`, and the shadcn CLI resolves it. The only
> thing published to npm is
> [`@liqui-design/glass`](https://www.npmjs.com/package/@liqui-design/glass),
> which the CLI installs for you.

### Requirements

- React 18 or 19
- Tailwind CSS v4

liqui uses the same Base UI base as shadcn/ui (`shadcn init -b base`), so an
existing `components.json`, `cn()` helper and Tailwind token setup carries over
unchanged.

## Usage

```tsx
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <main className="min-h-dvh bg-[url(/wallpaper.jpg)] bg-cover p-10">
      <Button variant="accent">Continue</Button>
    </main>
  );
}
```

Note the background. Glass refracts whatever sits behind it, so a surface on a
flat fill has nothing to work with and looks like a slightly grey box. Put these
components over imagery, video, a gradient with real edges, or content that
scrolls underneath.

## What you install

Components arrive as source code in your project. You own the files and edit them
like anything else in your codebase.

The refraction kernel is the exception. The displacement-map maths, the
document-wide SVG filter registry and the browser fallbacks stay in the
`@liqui-design/glass` package, since that is the part you would not want to
maintain by hand.

## Components

| | |
| --- | --- |
| [Accordion](https://liqui.design/docs/components/accordion) | Each item is its own surface, resizing with its panel |
| [Alert Dialog](https://liqui.design/docs/components/alert-dialog) | Modal and un-dismissible, refracting a dimmed scrim |
| [Button](https://liqui.design/docs/components/button) | Glass, accent and danger tints |
| [Checkbox](https://liqui.design/docs/components/checkbox) | Fills with accent while keeping the bezel and rim light |
| [Context Menu](https://liqui.design/docs/components/context-menu) | Submenus, checkbox and radio items, keep-mounted popup |
| [Dialog](https://liqui.design/docs/components/dialog) | The dismissible one; its corner close stays flat |
| [Field](https://liqui.design/docs/components/field) | Focus and invalid rings on the surface, not the input |
| [Menu](https://liqui.design/docs/components/menu) | A dropdown, kept clear of the glass trigger it hangs from |
| [Menubar](https://liqui.design/docs/components/menubar) | One strip, several menus, and triggers that flatten inside it |
| [Number Field](https://liqui.design/docs/components/number-field) | One group, one lens, and two steppers drawn as divisions of it |
| [Popover](https://liqui.design/docs/components/popover) | A glass panel with a drawn tail, holding flattened controls |
| [Progress](https://liqui.design/docs/components/progress) | The track is the lens; the fill is a wash laid over it |
| [Radio Group](https://liqui.design/docs/components/radio-group) | A list, not a strip, so every option is its own lens |
| [Select](https://liqui.design/docs/components/select) | Glass trigger and glass popup, kept from overlapping |
| [Slider](https://liqui.design/docs/components/slider) | The thumb is the lens; the rail is deliberately flat |
| [Switch](https://liqui.design/docs/components/switch) | The track is the lens; the thumb is deliberately opaque |
| [Tabs](https://liqui.design/docs/components/tabs) | The indicator is the lens, sliding along a flat groove |
| [Toast](https://liqui.design/docs/components/toast) | A column rather than a stack, so each one keeps the page behind it |
| [Toggle](https://liqui.design/docs/components/toggle) | A latching button whose glass fills while it is on |
| [Toggle Group](https://liqui.design/docs/components/toggle-group) | One strip, one lens, and toggles that flatten inside it |
| [Tooltip](https://liqui.design/docs/components/tooltip) | The smallest surface, frosted harder so it stays readable |

## Browser support

| | Refraction | Notes |
| --- | :---: | --- |
| Chromium | ✅ | Full displacement refraction |
| Safari | — | Drops `backdrop-filter` entirely when it references an SVG filter. WebKit bug [245510](https://bugs.webkit.org/show_bug.cgi?id=245510) has an implementation in review |
| Firefox | — | Same |

Falling back to frosted blur is automatic and needs no configuration, but check
how it looks. A design tuned with `frost: 0` can end up unreadable once the lens
is gone, because the lens was doing work the tint would otherwise have to do. The
[glass handbook](https://liqui.design/docs/handbook/glass#degradation) goes
through this.

## Background

liqui grew out of [Liquid Glass Design](https://liquidglassdesign.com/?ref=liqui.design),
a curated gallery of liquid glass and glassmorphism references, and the two are
still separate sites. The gallery collects the look; this is the part you can
install.

## Repository

```
packages/glass    @liqui-design/glass, the refraction kernel
apps/www          documentation site, and the registry the CLI installs from
apps/playground   Vite app for tuning the optics against a real backdrop
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) to run it locally or add a component.

## License

[MIT](./LICENSE)
