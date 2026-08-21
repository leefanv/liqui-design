import type { LoaderPlugin } from 'fumadocs-core/source';

import { Added } from '@/registry/__added__';
import { cn } from '@/lib/utils';

/**
 * The "New" marker, and the two numbers that decide who wears it.
 *
 * Every library that does this keeps a hand-written list — shadcn/ui has a
 * `PAGES_NEW` array of URLs, MUI a `newFeature: true` per page — and empties it
 * at the next release. It works while someone remembers. The failure is silent
 * and one-directional: nobody notices a badge that should have gone, so "New"
 * drifts into meaning "exists", and by then removing it looks like a change
 * rather than a correction.
 *
 * So the list here is derived instead. `registry.json` records the day each
 * component shipped, and the badge falls off on its own.
 *
 * Two rules, because either alone is wrong:
 *
 * - **A window**, so a badge cannot outlive its own news. Thirty days is what a
 *   reader who checks in monthly means by new, and it is roughly how long
 *   shadcn's list survives before a release replaces it.
 * - **A cap**, because this library ships in batches of three and a window
 *   alone would light half the sidebar. The week this was written every one of
 *   the twenty-one components was younger than thirty days, so the window on
 *   its own would have marked all of them and said nothing. Six is the last two
 *   batches.
 *
 * A component is new while it is *both* recent and among the most recent.
 */
export const NEW_FOR_DAYS = 30;
export const NEW_AT_MOST = 6;

/**
 * The capped set, by component name. Ranking has no clock in it — it is fixed
 * by the ship dates — so this is computed once, while the badge below is what
 * checks the window, on every render.
 */
export const newestComponents: ReadonlyMap<string, string> = new Map(
  Object.entries(Added)
    .sort(([nameA, a], [nameB, b]) => (a === b ? nameA.localeCompare(nameB) : b.localeCompare(a)))
    .slice(0, NEW_AT_MOST),
);

/** Whole days between a ship date and now, in the reader's terms rather than ms. */
function daysSince(added: string, now = new Date()): number {
  const shipped = Date.parse(`${added}T00:00:00Z`);
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.round((today - shipped) / 86_400_000);
}

export function isNew(name: string, now = new Date()): boolean {
  const added = newestComponents.get(name);
  return added != null && daysSince(added, now) < NEW_FOR_DAYS;
}

/**
 * Renders nothing once the window has passed.
 *
 * The date is read here rather than where the badge is attached, and that is
 * the whole point: the sidebar tree is built once per server process, so a
 * decision made there would be frozen until the next deploy. An element is
 * *created* at build time and *rendered* on every request, so the expiry rides
 * along with the page's own revalidation.
 */
export function NewBadge({ name, className }: { name: string; className?: string }) {
  if (!isNew(name)) return null;

  return (
    <span
      className={cn(
        'ms-2 rounded-full px-1.5 py-px align-middle text-[10px] font-semibold tracking-[0.04em] uppercase',
        // The brand accent rather than the docs chrome's own muted palette:
        // a badge the colour of every other label beside it is a label. The
        // token is document-wide (tokens.css is imported globally) and carries
        // its own dark value, so this follows the theme switch for free.
        'bg-[color-mix(in_srgb,var(--lq-accent)_12%,transparent)] text-[var(--lq-accent)]',
        className,
      )}
    >
      New
    </span>
  );
}

/**
 * Attaches the badge to the sidebar, the same way Fumadocs' own status-badges
 * plugin does — by wrapping the tree node's name. Only component pages are
 * eligible: a page's file path is `components/<name>.mdx`, and `<name>` is the
 * registry item that carries the date.
 */
export function newBadgesPlugin(): LoaderPlugin {
  return {
    name: 'liqui:new-badges',
    transformPageTree: {
      file(node, filePath) {
        const name = filePath?.match(/^components\/([^/]+)\.mdx$/)?.[1];
        if (!name || !newestComponents.has(name)) return node;

        node.name = (
          <>
            {node.name}
            <NewBadge name={name} />
          </>
        );
        return node;
      },
    },
  };
}
