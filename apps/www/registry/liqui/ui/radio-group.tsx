'use client';

import * as React from 'react';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Radio Group — one small glass surface per option.
 *
 * The group is not a surface. That is the difference from ToggleGroup, and it
 * is not a stylistic one: a toggle group is a single strip whose children share
 * one box, so the strip can hold the lens and the toggles inside it flatten. A
 * radio group is a *list* — the options are separate boxes with label text and
 * gaps between them, and there is no shared box to refract with. So each radio
 * is its own lens, exactly as each Checkbox is, and `RadioGroup` renders as a
 * plain flex column.
 *
 * Inside the ring, the dot is opaque rather than glass. It is the Switch thumb
 * again: `backdrop-filter` samples what is painted behind an element, and for a
 * dot sitting inside a glass ring that backdrop is the ring's own accent tint,
 * so a glass dot would bend the colour it is lying on and read as a smudge. It
 * gets a cast shadow instead, because the glass layers underneath give a child
 * no depth of its own.
 *
 * Selecting retints through `--lq-tint` rather than painting a filled circle,
 * so the bezel and specular arc survive the state change — same mechanism as
 * Checkbox and Switch.
 */

const RADIO_GLASS = {
  radius: 10,
  blur: 1,
  refraction: 20,
  bezel: 6,
} satisfies Partial<LiquiGlassProps>;

export function RadioGroup({ className, ...props }: BaseRadioGroup.Props) {
  return <BaseRadioGroup {...props} className={cn('flex flex-col gap-3', className)} />;
}

export interface RadioProps extends BaseRadio.Root.Props {
  /** Overrides for the underlying glass surface (radius, refraction, bezel…). */
  glass?: Partial<LiquiGlassProps>;
}

export function Radio({ glass, className, ...props }: RadioProps) {
  return (
    <BaseRadio.Root
      {...props}
      className={cn(
        // 20px, the same box as Checkbox — the smallest surface the lens is
        // asked to render, and the first place an over-driven `refraction`
        // smears. `rounded-full` is the DOM shape; `radius: 10` is the shape
        // the displacement map is generated for, and both have to say circle.
        'size-5 flex-none cursor-default rounded-full outline-none transition-transform duration-100 active:scale-[0.92]',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
        'data-[checked]:[--lq-tint:color-mix(in_srgb,var(--lq-accent)_88%,transparent)] data-[checked]:[--lq-tint-deep:color-mix(in_srgb,var(--lq-accent)_66%,transparent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      render={
        <LiquiGlass
          {...RADIO_GLASS}
          {...glass}
          contentClassName="flex size-full items-center justify-center rounded-full"
        />
      }
    >
      <BaseRadio.Indicator
        className={cn(
          'block size-[7px] rounded-full bg-white',
          'shadow-[0_1px_2px_rgba(10,15,40,0.35)]',
          'transition-[opacity,transform] duration-100',
          'data-[ending-style]:scale-[0.4] data-[ending-style]:opacity-0',
          'data-[starting-style]:scale-[0.4] data-[starting-style]:opacity-0',
        )}
      />
    </BaseRadio.Root>
  );
}

/**
 * Row wrapper pairing a radio with its text, so the whole line is the hit area.
 * `has-*` dims the label when the radio inside is disabled — the same shape as
 * `CheckboxLabel`.
 */
export function RadioLabel({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn(
        'flex cursor-default select-none items-center gap-2.5 text-[13.5px] font-medium text-[var(--lq-text)]',
        'has-[[data-disabled]]:text-[var(--lq-text-dim)]',
        className,
      )}
    >
      {children}
    </label>
  );
}
