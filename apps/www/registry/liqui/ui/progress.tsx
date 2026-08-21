'use client';

import { Progress as BaseProgress } from '@base-ui/react/progress';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Progress — the track is the lens, the fill is a wash over it.
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
 * So the fixed box keeps the lens. The fill is a translucent accent wash laid
 * over glass that is already refracting — the dialog's corner dismiss again —
 * which is why the bar bends the background along its whole length rather than
 * only in the empty part.
 *
 * The wash sits in the content layer, above the specular arc. On a bar filled
 * to 100% the shine therefore reads a little softer than on an empty one. That
 * is the cost of the fill not being a surface, and at this size it is cheaper
 * than the alternative.
 */

const TRACK_GLASS = {
  radius: 7,
  blur: 1,
  refraction: 22,
  bezel: 5,
} satisfies Partial<LiquiGlassProps>;

export function Progress({ className, ...props }: BaseProgress.Root.Props) {
  return <BaseProgress.Root {...props} className={cn('flex w-full flex-col gap-1.5', className)} />;
}

export function ProgressLabel({ className, ...props }: BaseProgress.Label.Props) {
  return (
    <BaseProgress.Label
      {...props}
      className={cn('text-[12.5px] font-semibold text-[var(--lq-text)]', className)}
    />
  );
}

export function ProgressValue({ className, ...props }: BaseProgress.Value.Props) {
  return (
    <BaseProgress.Value
      {...props}
      className={cn('text-[12.5px] tabular-nums text-[var(--lq-text-dim)]', className)}
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
      className={cn('h-3.5 w-full select-none', className)}
      render={
        <LiquiGlass
          {...TRACK_GLASS}
          {...glass}
          contentClassName="relative size-full overflow-hidden rounded-[inherit]"
        />
      }
    >
      <BaseProgress.Indicator
        className={cn(
          'absolute top-0 rounded-[inherit] bg-[color-mix(in_srgb,var(--lq-accent)_78%,transparent)]',
          // A hairline of the rim along the top edge, so the wash reads as
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
