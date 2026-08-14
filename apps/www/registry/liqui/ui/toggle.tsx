'use client';

import * as React from 'react';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Toggle — a two-state button whose "on" is a retint, not a fill.
 *
 * Same mechanism as Checkbox and Switch: pressing overrides `--lq-tint` rather
 * than painting a solid colour over the surface, so the bezel and the specular
 * arc survive the state change and the accent arrives *as glass*.
 *
 * Note what is not here. Button shrinks to 0.97 on `data-[pressed]`, because
 * Base UI puts that attribute on a pressable *trigger* while its popup is open
 * — a momentary state. On a Toggle `data-pressed` is the latched state, which
 * is why this component is built on the glass directly instead of composing
 * `render={<Button />}`: that composition would leave every toggled-on button
 * permanently scaled down.
 *
 * A Toggle inside `ToggleGroup` renders flat instead. There the strip is the
 * surface and a pressed toggle is a wash on glass that is already there —
 * nesting one lens inside another only bends the panel it is lying on. The
 * group announces itself through the context below; nothing else reads it.
 */

/** False inside a `ToggleGroup`, where the strip owns the glass. */
export const ToggleOwnsSurface = React.createContext(true);

const TOGGLE_GLASS = {
  radius: 12,
  blur: 1,
  refraction: 45,
  bezel: 11,
} satisfies Partial<LiquiGlassProps>;

export interface ToggleProps extends BaseToggle.Props {
  /** Overrides for the underlying glass surface (radius, refraction, bezel…). */
  glass?: Partial<LiquiGlassProps>;
}

export function Toggle({ glass, className, children, ...props }: ToggleProps) {
  const ownsSurface = React.useContext(ToggleOwnsSurface);

  // Flat variant. It keeps the native <button>: there is no glass anatomy to
  // put inside it here, so none of the reasons the glass variant has to opt out
  // of the native element apply.
  if (!ownsSurface) {
    return (
      <BaseToggle
        {...props}
        className={cn(
          'inline-flex cursor-default select-none items-center justify-center gap-[7px]',
          'rounded-[11px] border-none bg-transparent px-[11px] py-[7px]',
          'font-[inherit] text-[13px] leading-tight font-semibold whitespace-nowrap',
          'text-[var(--lq-text)] outline-none transition-[background-color,color] duration-150',
          'hover:not-data-disabled:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)]',
          'data-[pressed]:bg-[color-mix(in_srgb,var(--lq-accent)_80%,transparent)] data-[pressed]:text-white',
          'data-[pressed]:shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_70%,transparent)]',
          'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
          className,
        )}
      >
        {children}
      </BaseToggle>
    );
  }

  return (
    <BaseToggle
      {...props}
      // Same reason as Button: the glass anatomy is a stack of divs, and a
      // native <button> only accepts phrasing content.
      nativeButton={false}
      className={cn(
        'group inline-flex cursor-default select-none outline-none',
        'transition-[transform,box-shadow] duration-150 active:scale-[0.97]',
        'data-[pressed]:[--lq-tint:color-mix(in_srgb,var(--lq-accent)_88%,transparent)] data-[pressed]:[--lq-tint-deep:color-mix(in_srgb,var(--lq-accent)_66%,transparent)] data-[pressed]:text-white',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      render={
        <LiquiGlass
          {...TOGGLE_GLASS}
          {...glass}
          contentClassName="inline-flex items-center justify-center gap-[7px] rounded-[inherit] px-[13px] py-[9px] text-[13.5px] leading-tight font-semibold whitespace-nowrap group-hover:bg-[color-mix(in_srgb,var(--lq-highlight)_40%,transparent)] group-data-[pressed]:bg-transparent group-data-[disabled]:bg-transparent"
        />
      }
    >
      {children}
    </BaseToggle>
  );
}
