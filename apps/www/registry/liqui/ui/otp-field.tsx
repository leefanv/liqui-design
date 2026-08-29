'use client';

import * as React from 'react';
import { OTPField as BaseOTPField } from '@base-ui/react/otp-field';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui OTPField — six identical surfaces that cost one.
 *
 * Every slot is the same box at the same optics, and the displacement map cache
 * is keyed on exactly that pair. So a six-digit code generates one map and
 * reuses it six times; a twelve-digit one still generates one. This is the
 * cheapest row of glass in the library, and it looks like the most expensive.
 *
 * Each slot is a wrapper around a transparent `<input>` rather than an input
 * wearing glass, for the reason [Input](/docs/components/input) gives: an
 * `<input>` is a replaced element, so the backdrop, tint and specular layers
 * have nowhere to render. Which means the state that matters — focus, a filled
 * slot — belongs to a child, and the surface reacts with `has-*`.
 *
 * A filled slot retints rather than filling: `--lq-tint` picks up a little
 * accent, so the code reads as a row of lit windows without any of them losing
 * the bezel. Same move as [Checkbox](/docs/components/checkbox), at a size where
 * the alternative — a painted background — would cover the lens entirely.
 */

export const OTPField = BaseOTPField.Root;

const SLOT_GLASS = {
  radius: 12,
  blur: 1,
  refraction: 55,
  bezel: 12,
} satisfies Partial<LiquiGlassProps>;

/**
 * One slot. `data-filled` and `data-focused` are Base UI's, on the input; the
 * surface reads them off its child.
 */
export interface OTPFieldSlotProps extends Omit<BaseOTPField.Input.Props, 'className'> {
  glass?: Partial<LiquiGlassProps>;
  /** Classes for the glass surface — the slot's box is the thing you can see. */
  className?: string;
  /** Classes for the transparent `<input>` inside it. */
  inputClassName?: string;
}

export function OTPFieldSlot({
  glass,
  className,
  inputClassName,
  ...props
}: OTPFieldSlotProps) {
  return (
    <LiquiGlass
      {...SLOT_GLASS}
      {...glass}
      className={cn(
        'h-12 w-11 flex-none transition-shadow duration-150',
        'has-[input[data-filled]]:[--lq-tint:color-mix(in_srgb,var(--lq-accent)_22%,var(--lq-tint))]',
        'has-[input:focus-visible]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_35%,transparent)]',
        'has-[input[data-disabled]]:opacity-55',
        className,
      )}
      contentClassName="size-full rounded-[inherit]"
    >
      <BaseOTPField.Input
        {...props}
        className={cn(
          'size-full border-none bg-transparent text-center font-[inherit] text-[17px] font-semibold tabular-nums text-[var(--lq-text)] outline-none',
          'data-[disabled]:cursor-not-allowed',
          inputClassName,
        )}
      />
    </LiquiGlass>
  );
}

/**
 * The gap between groups of digits. The same incision
 * [Separator](/docs/components/separator) cuts, turned upright and shortened to
 * the height of a slot's middle — a full-height rule between two lenses reads as
 * a seventh slot with nothing in it.
 */
export function OTPFieldSeparator({ className, ...props }: BaseOTPField.Separator.Props) {
  return (
    <BaseOTPField.Separator
      {...props}
      className={cn(
        'mx-1 h-4 w-px flex-none self-center bg-[color-mix(in_srgb,var(--lq-text)_14%,transparent)]',
        'shadow-[1px_0_0_color-mix(in_srgb,var(--lq-rim-hi)_55%,transparent)]',
        className,
      )}
    />
  );
}

/**
 * Renders `length` slots, which is the shape almost every OTP field wants.
 * Group them yourself with `OTPFieldSlot` and `OTPFieldSeparator` when you need
 * `123-456`.
 */
export function OTPFieldSlots({
  length,
  ...props
}: OTPFieldSlotProps & { length: number }) {
  return (
    <>
      {Array.from({ length }, (_, index) => (
        <OTPFieldSlot key={index} aria-label={`Character ${index + 1} of ${length}`} {...props} />
      ))}
    </>
  );
}

/** The row. `length` is required on the root, so it is required here too. */
export function OTPFieldRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('flex items-center gap-2', className)} />;
}
