'use client';

import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Checkbox — Base UI checkbox as a LiquiGlass surface.
 *
 * At 20px the box is barely wider than its own bezel, which makes this the
 * smallest surface the lens is ever asked to render and the first place an
 * over-driven `refraction` smears. The optics below are scaled down hard from
 * the popup defaults for that reason — raise them and you will see it here
 * before anywhere else.
 *
 * Checking fills the glass with accent by overriding `--lq-tint` rather than
 * swapping in a flat box, so the bezel and specular arc survive the state
 * change. The mixed state retints identically — a `parent` checkbox inside a
 * `CheckboxGroup` is half-selected, not half-glass.
 */

const CHECKBOX_GLASS = {
  radius: 7,
  blur: 1,
  refraction: 20,
  bezel: 6,
} satisfies Partial<LiquiGlassProps>;

const CheckIcon = (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
    <path
      d="M2 6.4 4.7 9.1 10 3.1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IndeterminateIcon = (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
    <path d="M2.5 6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export interface CheckboxProps extends BaseCheckbox.Root.Props {
  glass?: Partial<LiquiGlassProps>;
}

export function Checkbox({ glass, className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      {...props}
      className={cn(
        'size-5 flex-none cursor-default outline-none transition-transform duration-100 active:scale-[0.92]',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
        'data-[checked]:[--lq-tint:color-mix(in_srgb,var(--lq-accent)_88%,transparent)] data-[checked]:[--lq-tint-deep:color-mix(in_srgb,var(--lq-accent)_66%,transparent)]',
        'data-[indeterminate]:[--lq-tint:color-mix(in_srgb,var(--lq-accent)_88%,transparent)] data-[indeterminate]:[--lq-tint-deep:color-mix(in_srgb,var(--lq-accent)_66%,transparent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      render={
        <LiquiGlass
          {...CHECKBOX_GLASS}
          {...glass}
          contentClassName="flex size-full items-center justify-center text-white"
        />
      }
    >
      {/* The mark is chosen from the indicator's *state*, not from the
          `indeterminate` prop. Inside a `CheckboxGroup` a `parent` checkbox is
          put into the mixed state by the group, and nothing is passed down here
          — reading the prop would draw a tick on a half-selected parent. */}
      <BaseCheckbox.Indicator
        className="inline-flex transition-[opacity,transform] duration-100 data-[ending-style]:scale-[0.6] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.6] data-[starting-style]:opacity-0"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>{state.indeterminate ? IndeterminateIcon : CheckIcon}</span>
        )}
      />
    </BaseCheckbox.Root>
  );
}

/**
 * Row wrapper pairing the box with its text, so the whole line is the hit area.
 * `has-*` dims the label when the box inside is disabled.
 */
export function CheckboxLabel({
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
