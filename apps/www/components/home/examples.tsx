import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Code2 } from 'lucide-react';

import { MountInView } from '@/components/home/mount-in-view';
import { PreviewBackdrop } from '@/components/preview-backdrop';
import { cn } from '@/lib/utils';
import { getTemplates } from '@/lib/templates';
import { Index } from '@/registry/__index__';

/**
 * The examples module on the home page: real screens and parts, each one the
 * file `shadcn add` writes, rendered live over the wallpaper.
 *
 * Server component, and the demos come out of the generated registry index the
 * docs previews read — so a tile here and the preview on the component's own
 * page cannot show different code. Each tile's demo mounts when it scrolls into
 * view (see MountInView); the frame, caption and link render on the server, so
 * the section has its full height and its words before any glass exists.
 *
 * Only demos that read at rest are here. A menu, a toast or a popover is a
 * button until you press it, and a tile of a button says nothing about glass —
 * those stay one click away on their own pages.
 */

interface Example {
  name: string;
  title: string;
  description: string;
  href: string;
}

const SURFACES: Example[] = [
  {
    name: 'tab-bar-demo',
    title: 'Tab bar',
    description: 'A floating bar whose selection is a lens; press one and it swells.',
    href: '/docs/components/tab-bar',
  },
  {
    name: 'toolbar-demo',
    title: 'Toolbar',
    description: 'Eight controls sharing one lens, toggles flattening into it.',
    href: '/docs/components/toolbar',
  },
  {
    name: 'accordion-demo',
    title: 'Accordion',
    description: 'Every item its own surface, remapped as its panel resizes.',
    href: '/docs/components/accordion',
  },
];

const CONTROLS: Example[] = [
  {
    name: 'switch-demo',
    title: 'Switch',
    description: 'An opaque pill at rest; hold it and it melts into a lens.',
    href: '/docs/components/switch',
  },
  {
    name: 'slider-demo',
    title: 'Slider',
    description: 'Drag the knob and the rail swells as it passes through.',
    href: '/docs/components/slider',
  },
];

export function Examples() {
  const template = getTemplates()[0];

  return (
    <section className="mt-20 sm:mt-24" aria-labelledby="examples">
      <h2 id="examples" className="text-2xl font-bold tracking-tight sm:text-3xl">
        Examples
      </h2>
      <p className="mt-3 max-w-2xl text-fd-muted-foreground">
        Screens and parts built from the components you install — each tile is the file{' '}
        <code className="rounded bg-fd-muted px-1 py-0.5 text-xs">shadcn add</code> writes,
        refracting the wallpaper behind it live. Copy one and it is yours.
      </p>

      {template && (
        <Group
          title="Screens"
          note="A whole page at product density: a dozen surfaces over one backdrop, every one of them bending what changes underneath it."
        >
          <Tile
            title={template.title ?? template.name}
            description={template.description ?? ''}
            href={`/templates/${template.name}`}
            action="Open template"
            className="sm:col-span-2"
          >
            {/* The same live miniature the templates index shows: laid out at
                a desktop width and scaled into the tile, because the template
                is built for a page and a crop of a page is a meaningless
                slice of its middle. `inert`, because this is a picture of a
                screen with a link under it, not a second copy of the screen. */}
            <div className="@container relative aspect-[16/10] w-full overflow-hidden">
              <MountInView className="absolute inset-0">
                <div
                  inert
                  aria-hidden
                  className="absolute top-0 left-0 h-[800px] w-[1280px] origin-top-left"
                  style={{ transform: 'scale(calc(100cqw / 1280px))' }}
                >
                  <React.Suspense fallback={null}>
                    <template.component />
                  </React.Suspense>
                </div>
              </MountInView>
            </div>
          </Tile>
        </Group>
      )}

      <Group
        title="Surfaces"
        note="Panels and bars that are glass the whole time. The edges behind them bend as they pass under the bezel."
      >
        {/* The demo is a phone-width screen, which is wider than a tile on a
            phone. Scaled rather than cropped: a transform leaves its layout
            size alone, so the glass still builds its maps at full size. */}
        <DemoTile
          example={SURFACES[0]}
          className="sm:row-span-2"
          previewClassName="min-h-[30rem]"
          contentClassName="max-sm:scale-[0.82]"
        />
        <DemoTile example={SURFACES[1]} previewClassName="min-h-[13rem]" />
        <DemoTile example={SURFACES[2]} previewClassName="min-h-[13rem] py-6" />
      </Group>

      <Group
        title="Controls"
        note="These two are not surfaces. They carry a lens of their own, hidden until you touch them — press and hold, and the backdrop bends through the thumb."
      >
        {CONTROLS.map((example) => (
          <DemoTile key={example.name} example={example} previewClassName="min-h-[14rem]" />
        ))}
      </Group>
    </section>
  );
}

function Group({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-12">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-xl text-sm text-fd-muted-foreground">{note}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

/** A registry demo, centred on the wallpaper. */
function DemoTile({
  example,
  className,
  previewClassName,
  contentClassName,
}: {
  example: Example;
  className?: string;
  previewClassName?: string;
  contentClassName?: string;
}) {
  const entry = Index[example.name];
  if (!entry) return null;
  const Component = entry.component;

  return (
    <Tile
      title={example.title}
      description={example.description}
      href={example.href}
      action="Code"
      className={className}
    >
      <PreviewBackdrop
        variant="wallpaper"
        className={cn(
          'flex h-full w-full items-center justify-center rounded-none border-0 p-6',
          previewClassName,
        )}
      >
        <MountInView className={cn('flex w-full items-center justify-center', contentClassName)}>
          <React.Suspense fallback={null}>
            <Component />
          </React.Suspense>
        </MountInView>
      </PreviewBackdrop>
    </Tile>
  );
}

/** A framed demo with a caption bar: what it is, and where its code lives. */
function Tile({
  title,
  description,
  href,
  action,
  className,
  children,
}: {
  title: string;
  description: string;
  href: string;
  action: 'Code' | 'Open template';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-fd-border bg-fd-card',
        className,
      )}
    >
      <div className="flex flex-1">{children}</div>
      <div className="flex items-center justify-between gap-4 border-t border-fd-border px-5 py-4">
        <div className="min-w-0">
          <h4 className="text-[15px] font-semibold">{title}</h4>
          <p className="mt-0.5 text-[13.5px] text-fd-muted-foreground">{description}</p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-fd-border bg-fd-background px-3.5 py-1.5 text-[13px] font-semibold no-underline transition-colors hover:bg-fd-muted"
        >
          {action === 'Code' ? (
            <Code2 className="size-3.5" />
          ) : (
            <ArrowUpRight className="size-3.5" />
          )}
          {action}
        </Link>
      </div>
    </article>
  );
}
