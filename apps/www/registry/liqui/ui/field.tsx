'use client';

import { Field as BaseField } from '@base-ui/react/field';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Field — Base UI field with the control sitting on its own glass
 * surface.
 *
 * The `<input>` stays a plain transparent element *inside* the glass content
 * layer. Making the input itself the glass root would put the backdrop and tint
 * layers inside a replaced element, where they cannot render at all.
 *
 * Focus and invalid rings live on the surface, not the input, and are driven by
 * `has-*` so the glass reacts to a state that belongs to its child.
 */

const CONTROL_GLASS = {
  radius: 12,
  blur: 1,
  refraction: 60,
  bezel: 12,
} satisfies Partial<LiquiGlassProps>;

export function Field({ className, ...props }: BaseField.Root.Props) {
  return <BaseField.Root {...props} className={cn('flex flex-col gap-1.5', className)} />;
}

export function FieldLabel({ className, ...props }: BaseField.Label.Props) {
  return (
    <BaseField.Label
      {...props}
      className={cn('text-[12.5px] font-semibold text-[var(--lq-text)]', className)}
    />
  );
}

export function FieldDescription({ className, ...props }: BaseField.Description.Props) {
  return (
    <BaseField.Description
      {...props}
      className={cn('text-xs text-[var(--lq-text-dim)]', className)}
    />
  );
}

export function FieldError({ className, ...props }: BaseField.Error.Props) {
  return (
    <BaseField.Error
      {...props}
      className={cn('text-xs font-semibold text-[var(--lq-danger-text)]', className)}
    />
  );
}

export function FieldControl({
  glass,
  className,
  ...props
}: BaseField.Control.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <LiquiGlass
      {...CONTROL_GLASS}
      {...glass}
      className={cn(
        'transition-shadow duration-150',
        'has-[input:focus-visible]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_35%,transparent)]',
        'has-[input[data-invalid][data-touched]]:shadow-[0_0_0_2px_color-mix(in_srgb,var(--lq-danger)_55%,transparent)]',
      )}
    >
      <BaseField.Control
        {...props}
        className={cn(
          'block w-full border-none bg-transparent px-3 py-[9px] font-[inherit] text-[13.5px] text-[var(--lq-text)] outline-none',
          'placeholder:text-[var(--lq-text-dim)]',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-55',
          className,
        )}
      />
    </LiquiGlass>
  );
}

export const FieldValidity = BaseField.Validity;
