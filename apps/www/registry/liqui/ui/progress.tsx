'use client';

import { Progress as BaseProgress } from '@base-ui/react/progress';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Progress — the track is the lens, the fill is paint over it.
 *
 * Slider answers "which of these two boxes refracts" with the thumb, because
 * the thumb is what moves. A progress bar has something that moves too, and it
 * still does not get the lens — because of *how* it moves. The displacement map
 * is keyed on the surface's size and cached in a 48-entry LRU; a thumb slides
 * at one size and reuses a single map for the whole drag, while a fill grows,
 * so a refracting fill would ask for a new map on every frame and evict every
 * other surface's map on the way past. An unrelated popup would then pay to
 * regenerate the next time it opened, because a download finished.
 *
 * So the fixed box keeps the lens, and the fill is the accent, solid — the
 * same paint as Slider's fill and a checked Switch. It was a 78% wash once, so
 * the glass would show through it, and what showed through was the tint: the
 * bar came out a paler, greyer cousin of the accent, and on a dark theme a
 * different colour altogether. A themed accent has to arrive as itself.
 *
 * The fill sits in the content layer, above the specular arc, so the filled
 * part is paint and the lens shows in the part still to go.
 */

// Apple's medium linear progress bar: a 10px capsule.
const TRACK_GLASS = {
  radius: 5,
  blur: 1,
  refraction: 18,
  bezel: 4,
} satisfies Partial<LiquiGlassProps>;

export function Progress({ className, ...props }: BaseProgress.Root.Props) {
  return <BaseProgress.Root {...props} className={cn('flex w-full flex-col gap-1.5', className)} />;
}

export function ProgressLabel({ className, ...props }: BaseProgress.Label.Props) {
  return (
    <BaseProgress.Label
      {...props}
      className={cn('text-[13px] font-medium text-[var(--lq-text)]', className)}
    />
  );
}

export function ProgressValue({ className, ...props }: BaseProgress.Value.Props) {
  return (
    <BaseProgress.Value
      {...props}
      className={cn('text-[13px] tabular-nums text-[var(--lq-text-dim)]', className)}
    />
  );
}

/**
 * The bar. Renders the indicator itself — unlike `SliderTrack`, there is
 * nothing else that can go inside one.
 */
export function ProgressTrack({
  glass,
  className,
  ...props
}: BaseProgress.Track.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseProgress.Track
      {...props}
      className={cn('h-2.5 w-full select-none', className)}
      render={
        <LiquiGlass
          {...TRACK_GLASS}
          {...glass}
          contentClassName="relative size-full overflow-hidden"
        />
      }
    >
      <BaseProgress.Indicator
        className={cn(
          'lq-corner absolute top-0 rounded-[inherit] bg-[var(--lq-accent)]',
          // A hairline of the rim along the top edge, so the fill reads as
          // sitting *in* the groove rather than printed on it.
          'shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_60%,transparent)]',
          'transition-[width] duration-500 ease-[cubic-bezier(0.2,0.8,0.3,1)]',
          // Base UI writes the width inline only when there is a value. With
          // `value={null}` it writes nothing, which is what leaves these two
          // free to take over.
          'data-[indeterminate]:w-full data-[indeterminate]:animate-pulse',
        )}
      />
    </BaseProgress.Track>
  );
}
