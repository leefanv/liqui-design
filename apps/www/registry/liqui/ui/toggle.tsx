'use client';

import * as React from 'react';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';

import { cn } from '@/lib/utils';

/**
 * liqui Toggle — a two-state button, flat in both states.
 *
 * The rule is [Checkbox](/docs/components/checkbox)'s: **glass is for the
 * surfaces you act *through*; a control that carries a value gets a solid
 * fill.** A toggle is a value — it is a checkbox that happens to be shaped like
 * a button — so "on" is `--lq-accent`, painted, and not a retint of a lens.
 *
 * That is the one place this parts company with [Button](/docs/components/button),
 * which it otherwise matches in size and shape. A button's default variant
 * stays glass because pressing it *does* something rather than *meaning*
 * something; a toggle's whole job is to hold a state you can read off it.
 *
 * Two surfaces, chosen by context:
 *
 * - **Standalone** — it draws the flat control surface itself, so it reads as
 *   a control against a wallpaper.
 * - **Inside `ToggleGroup`** — the strip is the surface, and the strip is still
 *   glass. A toggle in there is a wash on it and draws no fill of its own.
 *
 * The flattening is not a prop the caller passes: a toggle asks where it is,
 * so putting one in the right place is enough to make it behave.
 *
 * Note what is not here. Button shrinks to 0.97 on `data-[pressed]`, because
 * Base UI puts that attribute on a pressable *trigger* while its popup is open
 * — a momentary state. On a Toggle `data-pressed` is the latched state, so it
 * cannot drive the press animation; `active:` does.
 */

/** False inside a `ToggleGroup`, where the strip owns the surface. */
export const ToggleOwnsSurface = React.createContext(true);

const toggleVariants = cn(
  'inline-flex cursor-default select-none items-center justify-center gap-[7px]',
  // `leading-tight` goes with the font size in each branch below, never here:
  // tailwind-merge drops an earlier `leading-*` when a later `text-{size}`
  // could have carried one, and the label would inherit the page's line height.
  'border-none font-semibold whitespace-nowrap',
  'text-[var(--lq-text)] outline-none transition-[background-color,box-shadow,transform] duration-150',
  // On: a solid accent fill in both surfaces, so a toggle means the same thing
  // whether or not it is in a group.
  'data-[pressed]:bg-[var(--lq-accent)] data-[pressed]:text-white',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
);

export type ToggleProps = BaseToggle.Props;

export function Toggle({ className, children, ...props }: ToggleProps) {
  const ownsSurface = React.useContext(ToggleOwnsSurface);

  return (
    <BaseToggle
      {...props}
      className={cn(
        toggleVariants,
        ownsSurface
          ? cn(
              'rounded-[12px] px-[13px] py-[9px] text-[13.5px] leading-tight active:scale-[0.97]',
              'bg-[var(--lq-control)] shadow-[inset_0_0_0_1px_var(--lq-control-rim)]',
              'hover:not-data-disabled:not-data-pressed:bg-[color-mix(in_srgb,white_35%,var(--lq-control))]',
              'data-[pressed]:shadow-none',
              // An outline rather than a box-shadow ring, for the same reason
              // as Checkbox: it does not have to know what colour the control
              // is filled with.
              'focus-visible:outline-2 focus-visible:outline-offset-[3px]',
              'focus-visible:outline-[color-mix(in_srgb,var(--lq-accent)_70%,transparent)]',
            )
          : cn(
              'rounded-[11px] bg-transparent px-[11px] py-[7px] text-[13px] leading-tight',
              'hover:not-data-disabled:not-data-pressed:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)]',
              // Inside the strip the ring is inset: an offset outline would sit
              // on top of the neighbouring toggle.
              'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
            ),
        className,
      )}
    >
      {children}
    </BaseToggle>
  );
}
