'use client';

import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import { Heart } from 'lucide-react';

import { cn } from '@/lib/utils';
import { coverArt, type Track } from '@/registry/liqui/lib/media-player-data';

/**
 * The artwork, with an identity plate resting on it.
 *
 * The cover is deliberately not glass. Something on the page has to be the
 * subject — if every element refracts, each one is only bending its neighbour
 * and the whole composition goes grey. So the artwork is painted, with hard
 * seams in it, and the plate lying across its lower edge is the lens. Watch the
 * two diagonal bands where they cross the plate: they arrive displaced, and
 * they are the only reason you can tell this is a lens and not a blur.
 *
 * The plate is inset rather than overhanging. An earlier version had it hang
 * off the bottom edge, which put half of it over the page — a better seam, and
 * a worse layout: the column's height became artwork plus overhang, a number
 * nothing else in the grid could align to without being told it. Inset, this
 * column is exactly as tall as it is wide, and the panel beside it can simply
 * match.
 */

const PLATE_GLASS = {
  elevated: true,
  radius: 20,
  blur: 1,
  refraction: 110,
  bezel: 22,
} satisfies Partial<LiquiGlassProps>;

export function NowPlaying({
  track,
  favourite,
  onFavouriteChange,
  className,
}: {
  track: Track;
  favourite: boolean;
  onFavouriteChange: (favourite: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative aspect-square overflow-hidden rounded-[26px]',
        'shadow-[0_28px_64px_-24px_rgba(0,0,0,0.72)]',
        'transition-[background-image] duration-700',
        className,
      )}
      style={coverArt(track.palette)}
    >
      <LiquiGlass
        {...PLATE_GLASS}
        className="absolute inset-x-3 bottom-3"
        contentClassName="flex items-center gap-3 rounded-[inherit] px-3.5 py-3"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] leading-tight font-semibold text-[var(--lq-text)]">
            {track.title}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] leading-tight text-[var(--lq-text-dim)]">
            {track.artist} — {track.album}
          </p>
        </div>

        {/* Flat, not glass. It is sitting on the plate, and a lens on a lens has
            nothing to bend but the plate — see the note in library-panel. A
            heart carries its state in the fill, which survives being flat. */}
        <button
          type="button"
          onClick={() => onFavouriteChange(!favourite)}
          aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
          aria-pressed={favourite}
          className={cn(
            'inline-flex shrink-0 cursor-default items-center justify-center rounded-full p-2',
            'border-none bg-transparent outline-none transition-[background-color,color] duration-150',
            'hover:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)]',
            'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
            favourite ? 'text-[var(--lq-accent)]' : 'text-[var(--lq-text-dim)]',
          )}
        >
          <Heart className={cn('size-[17px]', favourite && 'fill-current')} />
        </button>
      </LiquiGlass>
    </div>
  );
}
