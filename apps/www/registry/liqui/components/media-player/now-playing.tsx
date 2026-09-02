'use client';

import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import { Heart, Volume1, Volume2, VolumeX } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Slider, SliderControl, SliderThumb, SliderTrack } from '@/registry/liqui/ui/slider';
import { Switch } from '@/registry/liqui/ui/switch';
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
 * The volume slider lives here rather than in the transport bar, and that is
 * the same argument from the other side. Slider's thumb is a lens, and a lens
 * needs something with edges behind it: on the transport strip its backdrop is
 * that strip's own frosted tint — a flat wash — and it has to be installed with
 * `lens={false}`, which is a white knob. Over the artwork it has the two
 * diagonal bands to bend, and it is the only control on this page that gets to
 * be what it is. Drag it across a band and the band arrives displaced, and the
 * rail visibly fattens where it passes behind the glass.
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
  volume,
  onVolumeChange,
  lossless,
  onLosslessChange,
  className,
}: {
  track: Track;
  favourite: boolean;
  onFavouriteChange: (favourite: boolean) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  lossless: boolean;
  onLosslessChange: (lossless: boolean) => void;
  className?: string;
}) {
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
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
      {/* Up here because this is where the bands are. The quality toggle is the
          one control on the page with no reason to sit near the transport, and
          the top of the cover is both empty and the busiest part of the
          painting — press it and both diagonals bend at once. */}
      <label className="absolute top-4 right-4 flex cursor-default items-center gap-2 select-none">
        <span className="text-[11px] tracking-[0.1em] uppercase text-white/75 [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
          Lossless
        </span>
        <Switch checked={lossless} onCheckedChange={onLosslessChange} />
      </label>

      {/* Laid straight on the artwork, with no surface under it. The mute
          button is flat — it is a button, not a lens, and two lenses side by
          side would each only be bending the other. */}
      <div className="absolute inset-x-4 bottom-[86px] flex items-center gap-2">
        <button
          type="button"
          onClick={() => onVolumeChange(volume === 0 ? 60 : 0)}
          aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          className={cn(
            'inline-flex shrink-0 cursor-default items-center justify-center rounded-full p-1.5',
            'border-none bg-transparent text-white/80 outline-none transition-colors duration-150',
            'hover:bg-white/15 focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
          )}
        >
          <VolumeIcon className="size-[15px]" />
        </button>
        <Slider
          value={volume}
          onValueChange={(value) => onVolumeChange(Array.isArray(value) ? value[0] : value)}
          aria-label="Volume"
          className="min-w-0 flex-1"
        >
          <SliderControl>
            <SliderTrack className="h-2.5">
              <SliderThumb />
            </SliderTrack>
          </SliderControl>
        </Slider>
      </div>

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
