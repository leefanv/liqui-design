'use client';

import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';

import { cn } from '@/lib/utils';

/**
 * liqui Checkbox — a flat control, not a glass surface.
 *
 * This is the line the library draws, and it is the one Apple draws: **glass is
 * for the surfaces you act *through* — popups, toolbars, sheets, buttons —
 * and a solid fill is for a control that carries a *value*.** A checkbox is
 * the second kind. Checked is not a mood the material takes on; it is a fact,
 * and a fact should not be refracting the wallpaper behind it.
 *
 * So there are two fills and nothing else: `--lq-control` with a hairline at
 * rest, `--lq-accent` when it is on. No backdrop-filter, no displacement map,
 * no specular arc. At 20px it was the smallest surface the lens was ever asked
 * to render and the first place an over-driven `refraction` smeared — that
 * fragility is gone with the lens, and so is a canvas render and an SVG filter
 * per box on screen.
 *
 * The mixed state takes the same accent fill with a dash instead of a tick:
 * inside a `CheckboxGroup`, a `parent` box is half-*selected*, which is a
 * different mark, not a different material.
 *
 * [Radio](/docs/components/radio-group), [Toggle](/docs/components/toggle) and
 * [Switch](/docs/components/switch) are flat for the same reason.
 */

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

export type CheckboxProps = BaseCheckbox.Root.Props;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      {...props}
      className={cn(
        'inline-flex size-5 flex-none cursor-default items-center justify-center rounded-[7px]',
        'border-none p-0 outline-none',
        'transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.92]',
        // Off: the flat control surface. The hairline is an inset ring rather
        // than a border so it costs no layout — the box stays exactly 20px.
        //
        // The mark is white in *both* states rather than being revealed by a
        // colour change: Base UI keeps the indicator mounted through its exit
        // animation, and a tick that turned transparent the instant the box was
        // unchecked would pop out instead of fading.
        'bg-[var(--lq-control)] text-white shadow-[inset_0_0_0_1px_var(--lq-control-rim)]',
        // On: a solid accent fill, and the hairline goes with it. A rim around
        // a filled control is the bezel of a material that is no longer there.
        'data-[checked]:bg-[var(--lq-accent)] data-[checked]:shadow-none',
        'data-[indeterminate]:bg-[var(--lq-accent)] data-[indeterminate]:shadow-none',
        // An outline rather than a box-shadow ring: `outline-offset` leaves the
        // gap Apple leaves, and unlike a shadow it does not have to know what
        // colour the control is filled with. Same focus treatment as Switch.
        'focus-visible:outline-2 focus-visible:outline-offset-[3px]',
        'focus-visible:outline-[color-mix(in_srgb,var(--lq-accent)_70%,transparent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
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
