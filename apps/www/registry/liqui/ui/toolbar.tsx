'use client';

import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';
import { ToggleOwnsSurface } from '@/registry/liqui/ui/toggle';

/**
 * liqui Toolbar — the strip is the lens, everything standing on it is flat.
 *
 * This is [ToggleGroup](/docs/components/toggle-group)'s conclusion arrived at
 * for a wider set of controls, and the rule behind it has not changed: two
 * surfaces that overlap leave the upper one refracting the lower one's tint
 * instead of the page. A toolbar is a surface with things on it, so the things
 * on it cannot be surfaces.
 *
 * Which makes this the flattest file in the library. Every part below is
 * colour on glass that is already there — a hover wash, a pressed wash, a
 * hairline for the separator — and the only `LiquiGlass` in it is the strip.
 *
 * A `Toggle` dropped onto a toolbar flattens itself, because `Toolbar` provides
 * the same context `ToggleGroup` does. That is why this component depends on
 * `toggle`: not to render one, but so that one placed here behaves.
 */

const STRIP_GLASS = {
  radius: 16,
  blur: 1,
  refraction: 70,
  bezel: 15,
} satisfies Partial<LiquiGlassProps>;

/** Shared by every pressable thing on the strip. */
const itemClass =
  'inline-flex cursor-default select-none items-center justify-center gap-[7px] rounded-[11px] border-none bg-transparent px-[11px] py-[7px] font-[inherit] text-[13px] leading-tight font-semibold whitespace-nowrap text-[var(--lq-text)] no-underline outline-none transition-[background-color,color] duration-150 hover:not-data-disabled:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)] focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50';

export function Toolbar({
  glass,
  className,
  children,
  ...props
}: BaseToolbar.Root.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <ToggleOwnsSurface.Provider value={false}>
      <BaseToolbar.Root
        {...props}
        className={cn('group inline-flex max-w-full', className)}
        render={
          <LiquiGlass
            {...STRIP_GLASS}
            {...glass}
            // `data-orientation` lands on the root, not on the wrapper the items
            // actually sit in, so the wrapper reads it off the group.
            contentClassName="flex items-center gap-1 rounded-[inherit] p-[5px] group-data-[orientation=vertical]:flex-col group-data-[orientation=vertical]:items-stretch"
          />
        }
      >
        {children}
      </BaseToolbar.Root>
    </ToggleOwnsSurface.Provider>
  );
}

export function ToolbarButton({ className, ...props }: BaseToolbar.Button.Props) {
  return <BaseToolbar.Button {...props} className={cn(itemClass, className)} />;
}

export function ToolbarLink({ className, ...props }: BaseToolbar.Link.Props) {
  return <BaseToolbar.Link {...props} className={cn(itemClass, className)} />;
}

/**
 * A cluster inside the strip — related controls with the air taken out from
 * between them, so the grouping is legible without a second surface or a pair
 * of separators around it.
 */
export function ToolbarGroup({ className, ...props }: BaseToolbar.Group.Props) {
  return (
    <BaseToolbar.Group
      {...props}
      className={cn(
        'flex items-center gap-px group-data-[orientation=vertical]:flex-col group-data-[orientation=vertical]:items-stretch',
        className,
      )}
    />
  );
}

/**
 * The same incision [Separator](/docs/components/separator) makes, at the size a
 * strip wants: a dim hairline with the lit wall cast one pixel past it, on the
 * side facing away from the key light.
 */
export function ToolbarSeparator({ className, ...props }: BaseToolbar.Separator.Props) {
  return (
    <BaseToolbar.Separator
      {...props}
      className={cn(
        'flex-none bg-[color-mix(in_srgb,var(--lq-text)_14%,transparent)]',
        'data-[orientation=vertical]:mx-1 data-[orientation=vertical]:h-5 data-[orientation=vertical]:w-px',
        'data-[orientation=vertical]:shadow-[1px_0_0_color-mix(in_srgb,var(--lq-rim-hi)_55%,transparent)]',
        'data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full',
        'data-[orientation=horizontal]:shadow-[0_1px_0_color-mix(in_srgb,var(--lq-rim-hi)_55%,transparent)]',
        className,
      )}
    />
  );
}

/**
 * An input on the strip, and the one part where flat costs something visible.
 *
 * [Input](/docs/components/input) is a lens with a transparent `<input>` inside
 * it, and that is the right answer on a page. Here the strip is already the
 * lens, so this is a recess instead: a wash of `--lq-scrim`, which is the one
 * token that is dark in both themes, with a shadow at the top and the rim's own
 * highlight along the bottom edge — the
 * [separator](/docs/components/separator)'s incision closed into a box.
 */
export function ToolbarInput({ className, ...props }: BaseToolbar.Input.Props) {
  return (
    <BaseToolbar.Input
      {...props}
      className={cn(
        'min-w-0 rounded-[11px] border-none px-2.5 py-[7px] font-[inherit] text-[13px] leading-tight text-[var(--lq-text)] outline-none',
        'bg-[color-mix(in_srgb,var(--lq-scrim)_30%,transparent)]',
        'shadow-[inset_0_1px_1px_color-mix(in_srgb,var(--lq-scrim)_35%,transparent),0_1px_0_color-mix(in_srgb,var(--lq-rim-hi)_45%,transparent)]',
        'placeholder:text-[var(--lq-text-dim)]',
        'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
    />
  );
}
