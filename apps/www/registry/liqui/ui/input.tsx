'use client';

import * as React from 'react';
import { Input as BaseInput } from '@base-ui/react/input';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Input — a transparent `<input>` living inside a glass surface.
 *
 * The input cannot *be* the glass. `LiquiGlass` renders a stack of layers —
 * refracting backdrop, tint, specular rim, content — and an `<input>` is a
 * replaced element: it has no place to put children, so those layers would
 * either not render or land outside the box. Same constraint that keeps
 * [Button](/docs/components/button) and [Select](/docs/components/select) off
 * the native element, arriving from the other direction.
 *
 * So the surface is a wrapper and the input is transparent inside it. Which
 * means the states that matter belong to a *child*, and the surface reacts with
 * `has-*` — focus and invalid rings are on the glass, not on the input, because
 * a ring drawn on the input would be a rectangle inside a rounded lens.
 *
 * [FieldControl](/docs/components/field) is the same surface around the same
 * element — Base UI's `Input` is a one-line re-export of `Field.Control`, so
 * the two liqui files wrap literally the same thing. They stay separate because
 * a registry item is one file, and because this one carries the slots a bare
 * input needs and a labelled field does not.
 */

const CONTROL_GLASS = {
  radius: 12,
  blur: 1,
  refraction: 60,
  bezel: 12,
} satisfies Partial<LiquiGlassProps>;

export interface InputProps extends BaseInput.Props {
  /** Overrides for the underlying glass surface (radius, refraction, bezel…). */
  glass?: Partial<LiquiGlassProps>;
  /**
   * Narrowed from Base UI's `string | (state) => string`: this one lands on the
   * glass wrapper rather than on the element Base UI renders, and the wrapper
   * has no state to be a function of.
   */
  className?: string;
  /**
   * Content before the input — a search glyph, a currency mark. It sits in the
   * *same* glass content layer as the input rather than on a surface of its
   * own: a second lens inside this one would have nothing behind it but this
   * one's tint, which is the case ToggleGroup flattens its toggles for.
   */
  start?: React.ReactNode;
  /** Content after the input — a unit, a clear button, a character count. */
  end?: React.ReactNode;
  /**
   * Classes for the `<input>` itself. `className` goes to the glass surface,
   * because the surface is the component's box — `<Input className="w-64" />`
   * has to widen the thing you can see, not a transparent element inside it.
   */
  inputClassName?: string;
}

export function Input({ glass, className, inputClassName, start, end, ...props }: InputProps) {
  return (
    <LiquiGlass
      {...CONTROL_GLASS}
      {...glass}
      className={cn(
        'w-full transition-shadow duration-150',
        'has-[input:focus-visible]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_35%,transparent)]',
        // `data-touched` as well as `data-invalid`: an empty required field is
        // invalid from the moment it mounts, and a form that greets you in red
        // is telling you off for nothing yet.
        'has-[input[data-invalid][data-touched]]:shadow-[0_0_0_2px_color-mix(in_srgb,var(--lq-danger)_55%,transparent)]',
        'has-[input[data-disabled]]:opacity-55',
        className,
      )}
      contentClassName="flex w-full items-center gap-2 rounded-[inherit] px-3 text-[13.5px] text-[var(--lq-text-dim)]"
    >
      {start ? <span className="flex flex-none items-center">{start}</span> : null}
      <BaseInput
        {...props}
        className={cn(
          'min-w-0 flex-1 border-none bg-transparent py-[9px] font-[inherit] text-[13.5px] text-[var(--lq-text)] outline-none',
          'placeholder:text-[var(--lq-text-dim)]',
          'data-[disabled]:cursor-not-allowed',
          inputClassName,
        )}
      />
      {end ? <span className="flex flex-none items-center">{end}</span> : null}
    </LiquiGlass>
  );
}
