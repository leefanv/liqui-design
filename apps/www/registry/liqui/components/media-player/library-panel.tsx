'use client';

import * as React from 'react';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import { Heart, Play, Plus, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/registry/liqui/ui/context-menu';
import { Field, FieldControl } from '@/registry/liqui/ui/field';
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from '@/registry/liqui/ui/tabs';
import { ON_PANEL, ON_PANEL_TINT } from '@/registry/liqui/components/media-player/on-panel';
import { ALBUMS, formatTime, type Track } from '@/registry/liqui/lib/media-player-data';

/**
 * One panel, one lens, three tabs.
 *
 * Two rules shape everything in here, and both come from the same fact: a
 * `backdrop-filter` samples what is painted behind its element, and behind
 * anything inside this panel is the panel.
 *
 * The first rule is where the lens goes. It goes on the container. A queue that
 * gave every row its own surface would have twenty lenses each bending the
 * nineteen above it, and would spend twenty entries of a displacement-map cache
 * that holds a few dozen. So the panel refracts once and the rows are washes
 * drawn on it. Album sections are plain headings rather than an `Accordion` for
 * the same reason — an `AccordionItem` is itself a surface.
 *
 * The second rule is what to do with the controls that have to live here
 * anyway — the search field and the tab indicator. Their lens is already lost,
 * so they give it up explicitly and get retinted to read as objects raised off
 * the panel; see `on-panel.ts` for why the default tint is wrong for them.
 *
 * Sound settings used to be a third tab in here and are now a popover on the
 * transport bar. A panel is good at holding a list. It is a poor host for a
 * column of switches and sliders, because every one of them arrives having
 * already lost the thing that makes it a liqui control — and a popover is a
 * floating surface over the page, where they do not have to.
 */

/**
 * A list that scrolls inside a rounded panel gets cut through the middle of a
 * row at the rim, which reads as a rendering fault rather than as more content.
 * Fading the last few pixels says "there is more" without a scrollbar.
 */
const SCROLL_FADE =
  '[mask-image:linear-gradient(to_bottom,black_calc(100%-22px),transparent)]';

const PANEL_GLASS = {
  elevated: true,
  radius: 24,
  blur: 1,
  refraction: 130,
  bezel: 26,
} satisfies Partial<LiquiGlassProps>;

export interface LibraryPanelProps {
  track: Track;
  onSelect: (track: Track) => void;
  query: string;
  onQueryChange: (query: string) => void;
  className?: string;
}

export function LibraryPanel({ track, onSelect, query, onQueryChange, className }: LibraryPanelProps) {
  return (
    <LiquiGlass
      {...PANEL_GLASS}
      className={cn('min-h-0', className)}
      contentClassName="flex h-full flex-col rounded-[inherit] p-3.5"
    >
      <Tabs defaultValue="queue" className="flex min-h-0 flex-1 flex-col gap-3">
        {/* `w-auto` so the strip is as wide as its two labels. Stretched to the
            panel it read as a header bar rather than a control. */}
        <TabsList className={cn('w-auto shrink-0 self-start', ON_PANEL_TINT)}>
          <TabsTab value="queue">Up next</TabsTab>
          <TabsTab value="lyrics">Lyrics</TabsTab>
          <TabsIndicator glass={ON_PANEL} />
        </TabsList>

        {/* The scroll lives on each panel, not on the Tabs root: the three have
            very different heights, and a shared scroller would size itself to
            the tallest and leave the short ones with dead space. */}
        <TabsPanel value="queue" className={cn('-mr-1.5 min-h-0 flex-1 overflow-y-auto pr-1.5 pb-1', SCROLL_FADE)}>
          <QueueTab currentId={track.id} query={query} onQueryChange={onQueryChange} onSelect={onSelect} />
        </TabsPanel>

        <TabsPanel value="lyrics" className={cn('-mr-1.5 min-h-0 flex-1 overflow-y-auto pr-1.5 pb-1', SCROLL_FADE)}>
          <div className="flex flex-col gap-2 px-1 py-1">
            {track.lyrics.map((line, i) => (
              <p
                key={i}
                className={cn(
                  'text-[14px] leading-snug font-medium transition-colors duration-300',
                  // No timing data behind this — the first line is simply the
                  // one being sung, which is enough to show the accent moving
                  // with the artwork.
                  i === 0 ? 'text-[var(--lq-text)]' : 'text-[var(--lq-text-dim)]',
                )}
              >
                {line}
              </p>
            ))}
          </div>
        </TabsPanel>

      </Tabs>
    </LiquiGlass>
  );
}

function QueueTab({
  currentId,
  query,
  onQueryChange,
  onSelect,
}: {
  currentId: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (track: Track) => void;
}) {
  const normalised = query.trim().toLowerCase();
  const albums = ALBUMS.map((album) => ({
    ...album,
    tracks: normalised
      ? album.tracks.filter((t) => `${t.title} ${t.artist}`.toLowerCase().includes(normalised))
      : album.tracks,
  })).filter((album) => album.tracks.length > 0);

  return (
    <div className="flex flex-col gap-2.5">
      {/* The tint goes on `Field`, not on `FieldControl`. FieldControl forwards
          its className to the input inside the surface, so the properties would
          land one element too deep to recolour the glass — custom properties
          inherit, so setting them on the wrapper reaches it. */}
      <Field className={ON_PANEL_TINT}>
        <FieldControl
          glass={ON_PANEL}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search the library"
          aria-label="Search the library"
        />
      </Field>

      {albums.length === 0 ? (
        <p className="px-1 py-8 text-center text-[12.5px] text-[var(--lq-text-dim)]">
          Nothing matches “{query}”.
        </p>
      ) : (
        albums.map((album) => (
          <section key={album.name}>
            <h3 className="px-2 pb-1 text-[10.5px] font-semibold tracking-[0.07em] text-[var(--lq-text-dim)] uppercase">
              {album.name}
            </h3>
            <ul className="flex flex-col gap-px">
              {album.tracks.map((t) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  current={t.id === currentId}
                  onSelect={() => onSelect(t)}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

/**
 * A row is a wash, not a surface — see the note at the top. The current one
 * retints toward the accent rather than filling with it, so the artwork behind
 * the panel still shows through the row that is playing.
 */
function TrackRow({
  track,
  current,
  onSelect,
}: {
  track: Track;
  current: boolean;
  onSelect: () => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <li>
            <button
              type="button"
              onClick={onSelect}
              aria-current={current ? 'true' : undefined}
              className={cn(
                'flex w-full cursor-default items-center gap-2.5 rounded-[10px] px-2 py-[7px]',
                'border-none bg-transparent text-left font-[inherit] outline-none',
                'transition-[background-color] duration-150',
                'hover:bg-[color-mix(in_srgb,var(--lq-highlight)_40%,transparent)]',
                'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
                current && 'bg-[color-mix(in_srgb,var(--lq-accent)_28%,transparent)]',
              )}
            >
              <span className="flex size-3.5 shrink-0 items-center justify-center text-[var(--lq-accent)]">
                {current && <Play className="size-[11px] fill-current" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--lq-text)]">
                {track.title}
              </span>
              <span className="shrink-0 text-[11.5px] tabular-nums text-[var(--lq-text-dim)]">
                {formatTime(track.duration)}
              </span>
            </button>
          </li>
        }
      />
      <ContextMenuContent>
        <ContextMenuItem onClick={onSelect}>
          <Play className="size-3.5" />
          Play
          <ContextMenuShortcut>⏎</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <Plus className="size-3.5" />
          Add to queue
        </ContextMenuItem>
        <ContextMenuItem>
          <Heart className="size-3.5" />
          Favourite
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Trash2 className="size-3.5" />
          Remove from library
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
