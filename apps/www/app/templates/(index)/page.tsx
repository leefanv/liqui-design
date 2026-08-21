import type { Metadata } from 'next';
import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { getTemplates } from '@/lib/templates';

export const metadata: Metadata = {
  title: 'Templates',
  description:
    'Whole pages built from liqui components, installable with the shadcn CLI. Glass at real density, over backdrops that give it something to refract.',
};

export default function TemplatesPage() {
  const templates = getTemplates();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Templates</h1>
      <p className="mt-3 max-w-2xl text-fd-muted-foreground">
        Component pages show one surface at a time. These are whole screens, which is where the
        material has to hold up: a dozen lenses at once, over a backdrop with real structure, at the
        density a product actually ships at. Each one installs as source, the same way the
        components do.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {templates.map((template) => (
          <Link
            key={template.name}
            href={`/templates/${template.name}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card no-underline transition-colors hover:border-fd-foreground/25"
          >
            {/* A live miniature, not a screenshot: it refracts, and it can
                never be out of date. Rendered at a desktop width and scaled
                down with a container query — the template is laid out for a
                page, and cropping a page into a card shows a meaningless slice
                of its middle.

                `transform` does not change layout size, so the surfaces inside
                still build their maps at full resolution: this costs a whole
                template's worth of glass per card and saves nothing. That is
                affordable for one or two. Past that, render these to static
                images at build time — displacement maps are cached by pixel
                size against a module-wide budget in the dozens, and a grid of
                live templates will evict the page it is sitting on.

                `inert` because the card is a link, and a slider you can drag
                inside something you click is a trap. */}
            <div className="@container relative aspect-[16/10] overflow-hidden border-b border-fd-border">
              <div
                inert
                aria-hidden
                className="absolute top-0 left-0 h-[800px] w-[1280px] origin-top-left"
                // Dividing a length by a length yields a number, which is what
                // scale() takes — `/ 1280` without the unit is a length, and the
                // whole declaration is dropped as invalid.
                style={{ transform: 'scale(calc(100cqw / 1280px))' }}
              >
                <React.Suspense fallback={<div className="size-full bg-fd-muted" />}>
                  <template.component />
                </React.Suspense>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-5">
              <h2 className="flex items-center gap-1.5 font-semibold">
                {template.title}
                <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-60" />
              </h2>
              <p className="text-sm text-fd-muted-foreground">{template.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
