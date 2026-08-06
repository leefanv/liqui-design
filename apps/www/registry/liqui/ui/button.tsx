'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * liqui Button — a Base UI button rendered as a LiquiGlass surface.
 *
 * The glass anatomy (backdrop/tint/specular layers + a content wrapper) can't
 * live inside a native `<button>`: its content model is phrasing content, so
 * the wrapper div would be invalid HTML. `nativeButton={false}` is Base UI's
 * supported escape — useButton then supplies `role="button"`, `tabIndex`, and
 * the Enter/Space handlers itself. The one thing it can't give back is implicit
 * form submission, so pass `nativeButton` explicitly (and drop the glass) for a
 * real submit button.
 *
 * Variants retint the glass by overriding `--lq-tint` rather than painting over
 * it, so the lens still refracts the background through the accent color.
 */

const buttonVariants = cva(
  'group inline-flex cursor-default select-none outline-none transition-[transform,box-shadow] duration-150 data-[pressed]:scale-[0.97] active:scale-[0.97] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
  {
    variants: {
      variant: {
        glass: 'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
        accent:
          'text-white [--lq-tint:color-mix(in_srgb,var(--lq-accent)_82%,transparent)] [--lq-tint-deep:color-mix(in_srgb,var(--lq-accent)_62%,transparent)] focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.55)]',
        danger:
          'text-white [--lq-tint:rgba(229,72,77,0.82)] [--lq-tint-deep:rgba(229,72,77,0.62)] focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.55)]',
      },
      size: {
        sm: '',
        md: '',
      },
    },
    defaultVariants: { variant: 'glass', size: 'md' },
  },
);

const buttonContentVariants = cva(
  'inline-flex items-center justify-center rounded-[inherit] font-semibold leading-tight whitespace-nowrap group-hover:bg-[color-mix(in_srgb,var(--lq-highlight)_40%,transparent)] group-data-[disabled]:bg-transparent',
  {
    variants: {
      size: {
        sm: 'gap-1.5 px-3 py-1.5 text-xs',
        md: 'gap-[7px] px-4 py-[9px] text-[13.5px]',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const BUTTON_GLASS = {
  radius: 12,
  blur: 1,
  refraction: 45,
  bezel: 11,
} satisfies Partial<LiquiGlassProps>;

export interface ButtonProps
  extends BaseButton.Props,
    VariantProps<typeof buttonVariants> {
  /** Overrides for the underlying glass surface (radius, refraction, bezel…). */
  glass?: Partial<LiquiGlassProps>;
}

export function Button({
  variant,
  size,
  glass,
  className,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      {...props}
      nativeButton={false}
      className={cn(buttonVariants({ variant, size }), className)}
      render={
        <LiquiGlass
          {...BUTTON_GLASS}
          {...glass}
          contentClassName={buttonContentVariants({ size })}
        />
      }
    />
  );
}

export { buttonVariants };
