'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * liqui Button — one component, two materials, chosen by what the button means.
 *
 * **`glass`** (the default) is a Base UI button rendered as a LiquiGlass
 * surface. The glass anatomy (backdrop/tint/specular layers + a content
 * wrapper) can't live inside a native `<button>`: its content model is phrasing
 * content, so the wrapper div would be invalid HTML. `nativeButton={false}` is
 * Base UI's supported escape — useButton then supplies `role="button"`,
 * `tabIndex`, and the Enter/Space handlers itself. The one thing it can't give
 * back is implicit form submission.
 *
 * **`accent` and `danger`** are flat: a solid fill, a real `<button>`, nothing
 * stacked behind the label. This is the library's dividing line and it is
 * Apple's — **glass is for the surfaces you act *through*, and a solid fill is
 * for a control that carries meaning.** A tinted lens is a contradiction: the
 * whole point of the colour is that it says "this is the one", and the whole
 * point of the lens is that it lets the wallpaper through. Accent over a dark
 * photo and accent over a light one used to be two different colours.
 *
 * Because they are native buttons, these two also get **implicit form
 * submission** back — `<Button type="submit" variant="accent">` submits.
 *
 * [Checkbox](/docs/components/checkbox), [Radio](/docs/components/radio-group),
 * [Toggle](/docs/components/toggle) and [Switch](/docs/components/switch) are
 * flat throughout, for the same reason: they carry a value rather than perform
 * an action.
 */

const glassButtonVariants = cva(
  'group inline-flex cursor-default select-none outline-none transition-[transform,box-shadow] duration-150 data-[pressed]:scale-[0.97] active:scale-[0.97] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
);

const glassButtonContentVariants = cva(
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

const solidButtonVariants = cva(
  cn(
    'inline-flex cursor-default select-none items-center justify-center',
    // `leading-tight` lives with each size below, not here. tailwind-merge
    // drops an earlier `leading-*` when a later `text-{size}` could have
    // carried one (Tailwind's `text-sm/6` syntax), so a line height written
    // before the font size silently loses and the label inherits the page's.
    'border-none font-semibold whitespace-nowrap text-white',
    'outline-none transition-[background-color,transform] duration-150',
    'data-[pressed]:scale-[0.97] active:scale-[0.97]',
    // An outline rather than a box-shadow ring: `outline-offset` leaves the gap
    // Apple leaves, and it reads against the fill without having to be mixed
    // out of it. The same ring Checkbox, Radio and Switch use.
    'focus-visible:outline-2 focus-visible:outline-offset-[3px]',
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
  ),
  {
    variants: {
      // `glass` is declared so the variant union is one list rather than two,
      // and left empty: the glass surface is a component, not a class string,
      // so `Button` branches before it ever asks for these.
      variant: {
        glass: '',
        accent: cn(
          'bg-[var(--lq-accent)]',
          'hover:not-data-disabled:bg-[color-mix(in_srgb,white_14%,var(--lq-accent))]',
          'focus-visible:outline-[color-mix(in_srgb,var(--lq-accent)_70%,transparent)]',
        ),
        danger: cn(
          'bg-[var(--lq-danger)]',
          'hover:not-data-disabled:bg-[color-mix(in_srgb,white_14%,var(--lq-danger))]',
          'focus-visible:outline-[color-mix(in_srgb,var(--lq-danger)_70%,transparent)]',
        ),
      },
      size: {
        sm: 'gap-1.5 px-3 py-1.5 text-xs leading-tight',
        md: 'gap-[7px] px-4 py-[9px] text-[13.5px] leading-tight',
      },
    },
    defaultVariants: { variant: 'accent', size: 'md' },
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
    VariantProps<typeof solidButtonVariants> {
  /**
   * Overrides for the underlying glass surface (radius, refraction, bezel…).
   *
   * A solid variant has no glass to reach, so the optical dials are ignored
   * there — `radius` is the exception, because it is geometry rather than
   * optics and a round accent button (a transport play button, say) still needs
   * to be able to say so.
   */
  glass?: Partial<LiquiGlassProps>;
}

export function Button({
  variant = 'glass',
  size = 'md',
  glass,
  className,
  style,
  ...props
}: ButtonProps) {
  if (variant !== 'glass') {
    return (
      <BaseButton
        {...props}
        style={{ borderRadius: glass?.radius ?? BUTTON_GLASS.radius, ...style }}
        className={cn(solidButtonVariants({ variant, size }), className)}
      />
    );
  }

  return (
    <BaseButton
      {...props}
      style={style}
      nativeButton={false}
      className={cn(glassButtonVariants(), className)}
      render={
        <LiquiGlass
          {...BUTTON_GLASS}
          {...glass}
          contentClassName={glassButtonContentVariants({ size })}
        />
      }
    />
  );
}

/**
 * The class builder for the solid variants, for the times you need a link or a
 * third-party trigger to look like an accent button:
 *
 * ```tsx
 * <a href="/pricing" className={buttonVariants({ variant: 'accent' })}>Upgrade</a>
 * ```
 *
 * It defaults to `accent` rather than to `Button`'s own default, because the
 * glass surface is four stacked layers and a class string cannot be one.
 */
export { solidButtonVariants as buttonVariants };
