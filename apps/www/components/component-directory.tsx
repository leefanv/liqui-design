import Link from 'next/link';

import { ComponentPreview } from '@/components/component-preview';
import { Index } from '@/registry/__index__';
import { source } from '@/lib/source';
import { docsRoute } from '@/lib/shared';

const COMPONENTS_URL = `${docsRoute}/components`;

/**
 * Demos taller than a tile. Centring crops them at both ends, which for the
 * accordion means opening on the middle of a sentence; from the top you get the
 * first item's header, which is what the component looks like. Everything else
 * fits, and centring is what makes a short demo sit properly in its tile.
 */
const CROP_FROM_TOP = new Set(['accordion-demo']);

/**
 * The components index, generated from the docs page tree rather than a hand-kept
 * list — adding a component page and its meta.json entry is enough to make it
 * appear here, in the same order the sidebar uses.
 *
 * Every tile shows the real demo on a real backdrop. A directory of a glass
 * library that shows no glass is a directory of nothing: the whole claim is that
 * these surfaces bend what is behind them, and a text link cannot make it.
 *
 * The demos are rendered but not operable. This page is navigation — a tile that
 * swallows the click to toggle a switch is a tile that failed at its one job, and
 * a half-working demo is worse than an honest picture. `inert` is what enforces
 * it: pointer events, focus and the accessibility tree all stop at the preview,
 * so each tile is a single tab stop that goes to the component's own page, where
 * the demo is real. The link's `after` pseudo-element is what makes the whole
 * tile clickable without nesting buttons and inputs inside an anchor.
 */
export function ComponentDirectory() {
  const pages = source
    .getPages()
    .filter((page) => page.url.startsWith(`${COMPONENTS_URL}/`))
    .sort((a, b) => order(a.url) - order(b.url));

  return (
    <div className="not-prose mt-8 grid gap-x-5 gap-y-6 sm:grid-cols-2">
      {pages.map((page) => {
        const slug = page.slugs[page.slugs.length - 1];
        const demo = `${slug}-demo`;

        return (
          <div key={page.url} className="group relative">
            {/* A fixed height, not a minimum: the demos are sized for a full
                component page, and letting each one set its own leaves the grid
                full of holes (the accordion alone is three times the switch).
                Tiles are a uniform window onto the demo; the page behind the
                link is where it gets to be its full size. */}
            {demo in Index ? (
              <div inert className="transition group-hover:brightness-110">
                <ComponentPreview
                  name={demo}
                  hideCode
                  align={CROP_FROM_TOP.has(demo) ? 'start' : 'center'}
                  className="my-0 h-[220px] min-h-0 overflow-hidden p-5"
                />
              </div>
            ) : null}
            <h3 className="mt-3 text-sm font-medium">
              <Link
                href={page.url}
                // Stretches over the whole tile, so the picture is part of the
                // link target without being inside the anchor element.
                className="after:absolute after:inset-0 after:rounded-xl group-hover:underline underline-offset-4"
              >
                {page.data.title}
              </Link>
            </h3>
          </div>
        );
      })}
    </div>
  );
}

/**
 * `getPages()` returns pages in no meaningful order, so the sidebar's own order —
 * the one meta.json defines — is recovered from the page tree.
 */
function order(url: string): number {
  const index = sidebarOrder().indexOf(url);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

let cached: string[] | undefined;
function sidebarOrder(): string[] {
  if (cached) return cached;

  const urls: string[] = [];
  const walk = (nodes: { type: string; url?: string; children?: unknown[] }[]) => {
    for (const node of nodes) {
      if (node.type === 'page' && node.url?.startsWith(`${COMPONENTS_URL}/`)) urls.push(node.url);
      if (node.children) walk(node.children as typeof nodes);
    }
  };
  walk(source.getPageTree().children as Parameters<typeof walk>[0]);

  cached = urls;
  return urls;
}
