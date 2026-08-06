import * as React from 'react';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

import { Index } from '@/registry/__index__';
import { Sources } from '@/registry/__sources__';
import { cn } from '@/lib/utils';
import { PreviewBackdrop } from '@/components/preview-backdrop';

/**
 * Renders a registry example twice: live, and as the source that ships.
 *
 * Server component on purpose — `Sources` is generated at build time and read
 * here, so demo source text never reaches the client bundle. Both the rendered
 * component and its code come from the generated registry index, which is what
 * guarantees the preview and `shadcn add` are showing the same file.
 *
 * No iframe. liqui's refraction filters live in one document-wide <svg>
 * registry (see @liqui-design/glass), and an iframe is a separate document — the
 * `url(#…)` references inside it would resolve to nothing and every surface
 * would silently fall back to plain frosted blur. Block-level previews that
 * genuinely need isolation will have to inject the registry per document
 * first.
 */
export function ComponentPreview({
  name,
  className,
  align = 'center',
  hideCode = false,
  backdrop = 'gradient',
}: {
  name: string;
  className?: string;
  align?: 'center' | 'start';
  hideCode?: boolean;
  backdrop?: 'gradient' | 'photo' | 'flat';
}) {
  const entry = Index[name];

  if (!entry) {
    return (
      <p className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm">
        Unknown preview <code>{name}</code>. Add it to <code>registry.json</code> and re-run{' '}
        <code>pnpm registry:build</code>.
      </p>
    );
  }

  const Component = entry.component;
  const source = Sources[name] ?? '';

  const preview = (
    <PreviewBackdrop
      variant={backdrop}
      className={cn(
        'flex min-h-[320px] w-full p-10',
        align === 'center' ? 'items-center justify-center' : 'items-start justify-start',
        className,
      )}
    >
      <React.Suspense fallback={<div className="text-sm opacity-60">Loading…</div>}>
        <Component />
      </React.Suspense>
    </PreviewBackdrop>
  );

  if (hideCode) return <div className="my-6">{preview}</div>;

  return (
    <Tabs items={['Preview', 'Code']} className="my-6">
      <Tab value="Preview" className="p-0">
        {preview}
      </Tab>
      <Tab value="Code" className="p-0 [&_figure]:my-0">
        <DynamicCodeBlock lang="tsx" code={source} />
      </Tab>
    </Tabs>
  );
}
