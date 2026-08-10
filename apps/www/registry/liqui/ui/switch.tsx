'use client';

import * as React from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Switch — the track is the lens, the thumb is not.
 *
 * A switch is two stacked round-rects, and only one of them can refract.
 * `backdrop-filter` samples whatever is painted *behind* the element, and for a
 * thumb sitting inside the track that backdrop is the track's own tint rather
 * than the page. A glass thumb on a glass track therefore bends the colour it
 * is lying on and reads as a smudge instead of a lens.
 *
 * The track wins here: it is the larger surface, and it is the one whose colour
 * carries on/off. Slider resolves the same conflict the other way — there the
 * moving part is the interesting one, so the track is flattened instead.
 *
 * Switching on retints the glass through `--lq-tint` rather than swapping in a
 * filled pill, so the bezel and the specular arc survive the transition. Same
 * trick as Checkbox.
 */

const TRACK_GLASS = {
  radius: 15,
  blur: 1,
  refraction: 30,
  bezel: 10,
} satisfies Partial<LiquiGlassProps>;

export interface SwitchProps extends BaseSwitch.Root.Props {
  /** Overrides for the underlying glass track (radius, refraction, bezel…). */
  glass?: Partial<LiquiGlassProps>;
}

export function Switch({ glass, className, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root
      {...props}
      className={cn(
        'h-[30px] w-[52px] flex-none cursor-default outline-none transition-shadow duration-150',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
        'data-[checked]:[--lq-tint:color-mix(in_srgb,var(--lq-accent)_88%,transparent)] data-[checked]:[--lq-tint-deep:color-mix(in_srgb,var(--lq-accent)_66%,transparent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      render={<LiquiGlass {...TRACK_GLASS} {...glass} contentClassName="size-full p-[2px]" />}
    >
      <BaseSwitch.Thumb
        className={cn(
          'block size-[26px] rounded-full bg-white',
          // Opaque, so it needs its own depth cues: a cast shadow and a hairline
          // edge. The glass layers underneath supply none of this to a child.
          'shadow-[0_1px_3px_rgba(10,15,40,0.32),0_0_0_0.5px_rgba(10,15,40,0.06)]',
          'transition-transform duration-200 ease-[cubic-bezier(0.3,1.25,0.4,1)]',
          // 52 − 2×2 padding − 26 thumb = 22px of travel.
          'data-[checked]:translate-x-[22px]',
        )}
      />
    </BaseSwitch.Root>
  );
}

/**
 * Settings-row wrapper: text on the left, switch pushed to the right, whole row
 * clickable. `has-*` dims the label when the switch inside is disabled.
 */
export function SwitchLabel({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn(
        'flex cursor-default select-none items-center justify-between gap-5 text-[13.5px] font-medium text-[var(--lq-text)]',
        'has-[[data-disabled]]:text-[var(--lq-text-dim)]',
        className,
      )}
    >
      {children}
    </label>
  );
}
