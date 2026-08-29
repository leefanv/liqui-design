'use client';

import { Meter as BaseMeter } from '@base-ui/react/meter';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Meter — a reading, on the same track [Progress](/docs/components/progress)
 * uses and for the same reason: the fixed box is the lens, the fill is a wash
 * over it. A growing fill would ask the map cache for a new entry on every
 * frame and evict every other surface's map on the way past; the full argument
 * is on the progress page and it applies here unchanged.
 *
 * What is not the same is time. A progress bar is a task advancing, so its width
 * transitions and the eye follows it. A meter is a measurement of something that
 * already is — disk in use, a score, a battery — and animating it draws motion
 * that never happened. So the fill here jumps, and `value` is required: there is
 * no indeterminate reading.
 *
 * The wash is `--lq-accent`, which is a token rather than a prop. A meter that
 * should turn red past a threshold overrides the token on the root, and the fill
 * follows — the same move `data-[checked]` makes on Checkbox, and the reason
 * this component has no `tone` prop.
 *
 * Base UI keeps Meter and Progress as separate primitives because they are
 * different things to a screen reader (`role="meter"`, not `role="progressbar"`),
 * and a registry item is one file — so these two are copies on purpose, exactly
 * as Menu and ContextMenu are.
 */

const TRACK_GLASS = {
  radius: 7,
  blur: 1,
  refraction: 22,
  bezel: 5,
} satisfies Partial<LiquiGlassProps>;

export function Meter({ className, ...props }: BaseMeter.Root.Props) {
  return <BaseMeter.Root {...props} className={cn('flex w-full flex-col gap-1.5', className)} />;
}

export function MeterLabel({ className, ...props }: BaseMeter.Label.Props) {
  return (
    <BaseMeter.Label
      {...props}
      className={cn('text-[12.5px] font-semibold text-[var(--lq-text)]', className)}
    />
  );
}

export function MeterValue({ className, ...props }: BaseMeter.Value.Props) {
  return (
    <BaseMeter.Value
      {...props}
      className={cn('text-[12.5px] tabular-nums text-[var(--lq-text-dim)]', className)}
    />
  );
}

/**
 * The bar. Unlike `ProgressTrack` this does not render its own indicator: Base
 * UI's anatomy puts `Meter.Indicator` inside the track as a child you write, and
 * a meter is the one bar that sometimes has something else in there with it — a
 * threshold marker, a target line. Progress has nothing else that can go inside
 * a track, which is why that one fills itself in.
 */
export function MeterTrack({
  children,
  glass,
  className,
  ...props
}: BaseMeter.Track.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseMeter.Track
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
      {children}
    </BaseMeter.Track>
  );
}

export function MeterIndicator({ className, ...props }: BaseMeter.Indicator.Props) {
  return (
    <BaseMeter.Indicator
      {...props}
      className={cn(
        'absolute top-0 rounded-[inherit] bg-[color-mix(in_srgb,var(--lq-accent)_78%,transparent)]',
        // A hairline of the rim along the top edge, so the wash reads as sitting
        // *in* the groove rather than printed on it.
        'shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_60%,transparent)]',
        // Only the colour transitions. The width is a reading, and a reading
        // that slides into place is claiming a change that did not happen.
        'transition-[background-color] duration-200',
        className,
      )}
    />
  );
}
