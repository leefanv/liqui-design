'use client';

import * as React from 'react';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';

import { cn } from '@/lib/utils';

/**
 * liqui Radio Group — a list of flat controls.
 *
 * Same rule as [Checkbox](/docs/components/checkbox): **glass is for the
 * surfaces you act *through*; a control that carries a value gets a solid
 * fill.** A radio is as literal a value as the library has — it is one bit of
 * a choice — so selecting it fills it with `--lq-accent` rather than retinting
 * a lens, and at rest it is `--lq-control` with a hairline.
 *
 * The group is not a surface either, and that part is unchanged. A toggle group
 * is a single strip whose children share one box, so the strip can hold a lens.
 * A radio group is a *list* — separate boxes with label text and gaps between
 * them, and no shared box to refract with. `RadioGroup` is a plain flex column.
 *
 * The dot is flat white with no cast shadow. It used to have one because the
 * glass layers underneath gave a child no depth of its own; there is nothing
 * left for it to lift off of, and a shadow inside a 20px solid circle is just
 * a smudge.
 */

export function RadioGroup({ className, ...props }: BaseRadioGroup.Props) {
  return <BaseRadioGroup {...props} className={cn('flex flex-col gap-3', className)} />;
}

export type RadioProps = BaseRadio.Root.Props;

export function Radio({ className, ...props }: RadioProps) {
  return (
    <BaseRadio.Root
      {...props}
      className={cn(
        // 20px, the same box as Checkbox, and now genuinely the same control:
        // one shape declaration instead of two. `rounded-full` used to have to
        // agree with a `radius` the displacement map was generated for, and
        // disagreeing gave you a circle lit like a square.
        'inline-flex size-5 flex-none cursor-default items-center justify-center rounded-full',
        'border-none p-0 outline-none',
        'transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.92]',
        'bg-[var(--lq-control)] shadow-[inset_0_0_0_1px_var(--lq-control-rim)]',
        'data-[checked]:bg-[var(--lq-accent)] data-[checked]:shadow-none',
        // Same focus treatment as Checkbox and Switch: an outline, so the ring
        // does not have to know what colour the control is filled with.
        'focus-visible:outline-2 focus-visible:outline-offset-[3px]',
        'focus-visible:outline-[color-mix(in_srgb,var(--lq-accent)_70%,transparent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
    >
      <BaseRadio.Indicator
        className={cn(
          'block size-[7px] rounded-full bg-white',
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
