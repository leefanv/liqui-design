'use client';

import type * as React from 'react';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/registry/liqui/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/liqui/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/liqui/ui/select';
import { Slider, SliderControl, SliderThumb, SliderTrack } from '@/registry/liqui/ui/slider';
import { Switch, SwitchLabel } from '@/registry/liqui/ui/switch';
import { Toggle, ToggleOwnsSurface } from '@/registry/liqui/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/liqui/ui/tooltip';
import {
  ON_PANEL,
  ON_PANEL_TINT,
} from '@/registry/liqui/components/media-player/on-panel';
import { formatTime, type Track } from '@/registry/liqui/lib/media-player-data';

/**
 * One bar, spanning the composition, carrying everything that is not a list.
 *
 * The version this replaces had the scrubber in a plate under the artwork and
 * the transport in a pill beneath it: two rounded rectangles of nearly the same
 * size, stacked, neither of them the obvious place to look. Elapsed time and
 * the play button belong to the same act. They are one row now, and the row
 * runs the full width of the grid, which is also what gives the layout a base
 * to sit on.
 *
 * The bar is a lens. Almost nothing inside it is: the icon buttons are washes,
 * the two slider thumbs are `clear`, and the single exception is play/pause —
 * a button carries its meaning in its shape and retints densely enough to
 * survive sampling the bar instead of the page, which is the same call the
 * Popover page makes for the button beside its switches.
 */

const BAR_GLASS = {
  elevated: true,
  radius: 22,
  blur: 1,
  refraction: 115,
  bezel: 24,
} satisfies Partial<LiquiGlassProps>;

/** Smaller box, smaller numbers — bezel is a fraction of the surface. */
const PLAY_GLASS = {
  radius: 21,
  blur: 1,
  refraction: 38,
  bezel: 9,
} satisfies Partial<LiquiGlassProps>;

export type RepeatMode = 'off' | 'all' | 'one';

const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };

export function TransportBar({
  track,
  elapsed,
  onSeek,
  playing,
  onPlayingChange,
  onPrevious,
  onNext,
  shuffle,
  onShuffleChange,
  repeat,
  onRepeatChange,
  volume,
  onVolumeChange,
  sound,
  className,
}: {
  track: Track;
  elapsed: number;
  onSeek: (seconds: number) => void;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  shuffle: boolean;
  onShuffleChange: (shuffle: boolean) => void;
  repeat: RepeatMode;
  onRepeatChange: (repeat: RepeatMode) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  sound: SoundSettings;
  className?: string;
}) {
  const muted = volume === 0;

  return (
    // `ToggleOwnsSurface` is how ToggleGroup flattens its children, and it
    // applies here for the same reason: the strip is the surface. A toggle asks
    // whether it is already on glass rather than taking a `flat` prop, so
    // putting one in the right place is enough to make it behave.
    <ToggleOwnsSurface.Provider value={false}>
      <LiquiGlass
        {...BAR_GLASS}
        className={className}
        // Wraps into three centred rows on a narrow screen — transport, then
        // modes and volume, then the scrubber — and collapses to one at `sm`.
        contentClassName="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-[inherit] px-4 py-3 sm:flex-nowrap"
      >
        <div className="flex w-full shrink-0 items-center justify-center gap-1 sm:w-auto sm:justify-start">
          <IconButton label="Previous" onClick={onPrevious}>
            <SkipBack className="size-[18px] fill-current" />
          </IconButton>

          <Button
            variant="accent"
            onClick={() => onPlayingChange(!playing)}
            aria-label={playing ? 'Pause' : 'Play'}
            glass={PLAY_GLASS}
            className="mx-0.5"
          >
            <span className="flex size-[22px] items-center justify-center">
              {playing ? (
                <Pause className="size-[17px] fill-current" />
              ) : (
                <Play className="size-[17px] translate-x-px fill-current" />
              )}
            </span>
          </Button>

          <IconButton label="Next" onClick={onNext}>
            <SkipForward className="size-[18px] fill-current" />
          </IconButton>
        </div>

        {/* The scrubber takes the slack. Its times are fixed-width and tabular
            so the rail does not jump a pixel every time a digit changes. */}
        <div className="order-last flex w-full min-w-0 items-center gap-2.5 sm:order-none sm:flex-1">
          <span className="w-9 shrink-0 text-right text-[11.5px] tabular-nums text-[var(--lq-text-dim)]">
            {formatTime(elapsed)}
          </span>
          <Slider
            value={elapsed}
            max={track.duration}
            onValueChange={(value) => onSeek(Array.isArray(value) ? value[0] : value)}
            aria-label="Seek"
          >
            <SliderControl className="py-1.5">
              <SliderTrack className="h-2">
                <SliderThumb lens={false} className="size-[18px]" />
              </SliderTrack>
            </SliderControl>
          </Slider>
          <span className="w-9 shrink-0 text-[11.5px] tabular-nums text-[var(--lq-text-dim)]">
            -{formatTime(track.duration - elapsed)}
          </span>
        </div>

        <div className="flex w-full shrink-0 items-center justify-center gap-1 sm:w-auto sm:justify-start">
          <Toggle pressed={shuffle} onPressedChange={onShuffleChange} aria-label="Shuffle">
            <Shuffle className="size-4" />
          </Toggle>
          <Toggle
            pressed={repeat !== 'off'}
            // Three states on a two-state control: pressing cycles
            // off → all → one → off, and `pressed` reports "not off".
            onPressedChange={() => onRepeatChange(NEXT_REPEAT[repeat])}
            aria-label={`Repeat: ${repeat}`}
          >
            {repeat === 'one' ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
          </Toggle>

          <span className="mx-1.5 h-5 w-px bg-[var(--lq-rim-lo)]" />

          <IconButton
            label={muted ? 'Unmute' : 'Mute'}
            onClick={() => onVolumeChange(muted ? 60 : 0)}
          >
            {muted ? <VolumeX className="size-[17px]" /> : <Volume2 className="size-[17px]" />}
          </IconButton>
          <Slider
            value={volume}
            onValueChange={(value) => onVolumeChange(Array.isArray(value) ? value[0] : value)}
            aria-label="Volume"
            className="w-[76px] shrink-0"
          >
            <SliderControl className="py-1.5">
              <SliderTrack className="h-2">
                <SliderThumb lens={false} className="size-[18px]" />
              </SliderTrack>
            </SliderControl>
          </Slider>

          <SoundPopover {...sound} />
        </div>
      </LiquiGlass>
    </ToggleOwnsSurface.Provider>
  );
}

/**
 * A control on the bar rather than a control of its own: no surface, no bezel,
 * just a hover wash and a focus ring. It keeps the native `<button>` — the
 * reason liqui's Button opts out of one is that a stack of divs cannot live
 * inside phrasing content, and there is no glass anatomy to put in here.
 */
function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={cn(
              'inline-flex cursor-default items-center justify-center rounded-full p-2',
              'border-none bg-transparent text-[var(--lq-text)] outline-none',
              'transition-[background-color] duration-150',
              'hover:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)]',
              'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
            )}
          >
            {children}
          </button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export interface SoundSettings {
  bands: Bands;
  onBandChange: (id: keyof Bands, value: number) => void;
  output: string;
  onOutputChange: (output: string) => void;
  lossless: boolean;
  onLosslessChange: (lossless: boolean) => void;
  crossfade: boolean;
  onCrossfadeChange: (crossfade: boolean) => void;
}

const BANDS = [
  { id: 'low', label: 'Low' },
  { id: 'mid', label: 'Mid' },
  { id: 'high', label: 'High' },
] as const;

export type Bands = Record<(typeof BANDS)[number]['id'], number>;

const OUTPUTS = [
  { value: 'speakers', label: 'Built-in speakers' },
  { value: 'studio', label: 'Studio monitors' },
  { value: 'headphones', label: 'Headphones' },
];

/**
 * Sound settings, in the surface they belong in.
 *
 * These lived in a third tab of the library panel and were wrong there: a
 * column of switches and sliders inside a panel is a column of controls that
 * have each already lost their lens before you see them. A popover is a
 * floating surface over the *page*, so its own lens is real — and the controls
 * inside it get the treatment the Popover page documents, which is where the
 * `clear` tier comes from in the first place.
 *
 * The switches keep the default tint rather than the pane retint used
 * elsewhere: a switch's accent is its state, and it is dense enough to read
 * without help.
 */
function SoundPopover({
  bands,
  onBandChange,
  output,
  onOutputChange,
  lossless,
  onLosslessChange,
  crossfade,
  onCrossfadeChange,
}: SoundSettings) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Sound settings"
            className={cn(
              'inline-flex cursor-default items-center justify-center rounded-full p-2',
              'border-none bg-transparent text-[var(--lq-text)] outline-none',
              'transition-[background-color] duration-150',
              'hover:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)]',
              'data-[popup-open]:bg-[color-mix(in_srgb,var(--lq-highlight)_55%,transparent)]',
              'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
            )}
          >
            <SlidersHorizontal className="size-[17px]" />
          </button>
        }
      />
      <PopoverContent className="w-[260px]">
        <PopoverTitle>Sound</PopoverTitle>

        <div className="mt-3 flex flex-col gap-3">
          {BANDS.map((band) => (
            <Slider
              key={band.id}
              value={bands[band.id]}
              min={-12}
              max={12}
              onValueChange={(value) =>
                onBandChange(band.id, Array.isArray(value) ? value[0] : value)
              }
              aria-label={`${band.label} gain`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 shrink-0 text-[12px] text-[var(--lq-text-dim)]">
                  {band.label}
                </span>
                <SliderControl className="py-1">
                  <SliderTrack className="h-2">
                    <SliderThumb lens={false} className="size-[18px]" />
                  </SliderTrack>
                </SliderControl>
                <span className="w-10 shrink-0 text-right text-[11.5px] tabular-nums text-[var(--lq-text-dim)]">
                  {bands[band.id] > 0 ? '+' : ''}
                  {bands[band.id]} dB
                </span>
              </div>
            </Slider>
          ))}
        </div>

        <div className="my-3.5 h-px bg-[var(--lq-rim-lo)]" />

        <Select
          items={OUTPUTS}
          value={output}
          onValueChange={(value) => value && onOutputChange(value)}
        >
          <SelectTrigger className={cn('w-full', ON_PANEL_TINT)} glass={ON_PANEL}>
            <SelectValue />
          </SelectTrigger>
          {/* The popup is not clear: it floats over the page, not over the
              popover, so it gets a real lens. */}
          <SelectContent>
            {OUTPUTS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-3 flex flex-col gap-2.5">
          <SwitchLabel>
            Lossless
            <Switch lens={false} checked={lossless} onCheckedChange={onLosslessChange} />
          </SwitchLabel>
          <SwitchLabel>
            Crossfade
            <Switch lens={false} checked={crossfade} onCheckedChange={onCrossfadeChange} />
          </SwitchLabel>
        </div>
      </PopoverContent>
    </Popover>
  );
}
