'use client';

import { Slider as BaseSlider } from '@base-ui/react/slider';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Slider — the thumb is the lens, the track is not.
 *
 * This is the mirror image of Switch, and for the same reason: nesting one
 * `backdrop-filter` inside another makes the inner one sample its parent's
 * output instead of the page. Here the moving part is the interesting one, so
 * the track is flattened to a plain translucent rail and the thumb gets to be
 * real glass — it refracts the wallpaper straight through the rail it slides
 * along.
 *
 * Dragging costs nothing extra. The displacement map is keyed on size and
 * optics, and neither changes while the thumb moves, so the whole drag reuses a
 * single cached map and a single registered filter.
 */

const THUMB_GLASS = {
  radius: 13,
  blur: 1,
  refraction: 34,
  bezel: 9,
} satisfies Partial<LiquiGlassProps>;

export function Slider({ className, ...props }: BaseSlider.Root.Props) {
  return <BaseSlider.Root {...props} className={cn('flex w-full flex-col gap-1', className)} />;
}

export function SliderLabel({ className, ...props }: BaseSlider.Label.Props) {
  return (
    <BaseSlider.Label
      {...props}
      className={cn('text-[12.5px] font-semibold text-[var(--lq-text)]', className)}
    />
  );
}

export function SliderValue({ className, ...props }: BaseSlider.Value.Props) {
  return (
    <BaseSlider.Value
      {...props}
      className={cn('text-[12.5px] tabular-nums text-[var(--lq-text-dim)]', className)}
    />
  );
}

export function SliderControl({ className, ...props }: BaseSlider.Control.Props) {
  return (
    <BaseSlider.Control
      {...props}
      // The padding is the hit area. The rail is 12px tall and the thumb 26px,
      // so without it the control box is shorter than the thing you grab.
      className={cn('flex w-full touch-none select-none items-center py-2.5', className)}
    />
  );
}

/**
 * The rail. Deliberately not a LiquiGlass surface — see the note above — so it
 * is drawn the cheap way: a tinted groove with an inset shadow for depth.
 * `Slider.Indicator` fills it from the start edge and inherits its height.
 */
export function SliderTrack({ children, className, ...props }: BaseSlider.Track.Props) {
  return (
    <BaseSlider.Track
      {...props}
      className={cn(
        'h-3 w-full select-none rounded-full',
        'bg-[color-mix(in_srgb,var(--lq-text)_14%,transparent)]',
        'shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--lq-text)_16%,transparent),inset_0_0_0_0.5px_var(--lq-rim-lo)]',
        className,
      )}
    >
      <BaseSlider.Indicator className="rounded-full bg-[var(--lq-accent)]" />
      {children}
    </BaseSlider.Track>
  );
}

export function SliderThumb({
  glass,
  className,
  ...props
}: BaseSlider.Thumb.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseSlider.Thumb
      {...props}
      className={cn(
        'size-[26px] select-none transition-shadow duration-150',
        // Cast shadow so the puck reads as lifted off the rail. The focus ring
        // has to restate it: one `box-shadow` declaration replaces the other.
        'shadow-[0_2px_6px_rgba(10,15,40,0.26)]',
        'has-[:focus-visible]:shadow-[0_2px_6px_rgba(10,15,40,0.26),0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
        'data-[disabled]:opacity-50',
        className,
      )}
      // Base UI positions the thumb with inline `position/inset/translate`.
      // LiquiGlass spreads the style it is handed, so those survive the swap.
      render={<LiquiGlass {...THUMB_GLASS} {...glass} />}
    />
  );
}
