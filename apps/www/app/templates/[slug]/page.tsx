import type { Metadata } from 'next';
import * as React from 'react';
import { notFound } from 'next/navigation';

import { getTemplate, getTemplates, installCommand } from '@/lib/templates';
import { gitConfig, repoUrl, siteUrl } from '@/lib/shared';
import { TemplateChrome } from '@/components/template-chrome';

export function generateStaticParams() {
  return getTemplates().map((template) => ({ slug: template.name }));
}

export async function generateMetadata(props: PageProps<'/templates/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const template = getTemplate(slug);
  if (!template) notFound();

  return { title: template.title, description: template.description };
}

export default async function TemplatePage(props: PageProps<'/templates/[slug]'>) {
  const { slug } = await props.params;
  const template = getTemplate(slug);
  if (!template) notFound();

  const Template = template.component;

  return (
    // A definite height, not `flex-1`. Templates size themselves against their
    // container, and the root layout's body is `min-h-screen` with auto-height
    // children — a percentage against `auto` resolves to the content, which is
    // how a full-screen template ends up two thirds of the way down the page.
    //
    // No padding for the chrome. Padding here would show the page background
    // above the template as a white band; the chrome floats over the template
    // instead, which is what a glass strip is for.
    //
    // The scroll lives here rather than on the template, so the template's
    // backdrop grows with its content and still covers every pixel of it when
    // the layout stacks on a narrow screen.
    <div data-template-page className="relative isolate h-dvh overflow-y-auto">
      {/* `scrollbar-gutter: stable` is right for the docs and wrong here: this
          page never scrolls the document, so the reserved gutter is a permanent
          strip of page background down the right edge — invisible under macOS
          overlay scrollbars, an obvious seam everywhere else.

          Emitted from the page rather than written as `html:has(…)` in the
          global stylesheet. An unbounded `:has()` on the root element makes the
          engine re-check the whole document on every mutation, and the cost is
          not theoretical: with that rule in place the docs' tab-switch test
          started measuring stale layout often enough to fail. React hoists this
          into <head> while the route is mounted and takes it away on the way
          out, which is exactly the scope wanted. */}
      <style>{'html{scrollbar-gutter:auto}'}</style>
      <TemplateChrome
        title={template.title}
        command={installCommand(template.name, siteUrl)}
        sourceUrl={`${repoUrl}/tree/${gitConfig.branch}/apps/www/${template.source.replace(/\/[^/]+$/, '')}`}
      />
      {/* Not an iframe. liqui's refraction filters live in one document-wide
          <svg> registry, and an iframe is a separate document — every
          `url(#…)` inside it would resolve to nothing and the whole page would
          silently fall back to frosted blur. */}
      <React.Suspense fallback={null}>
        <Template />
      </React.Suspense>
    </div>
  );
}
