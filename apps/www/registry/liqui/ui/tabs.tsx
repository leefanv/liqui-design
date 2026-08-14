'use client';

import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Tabs — the indicator is the lens, the strip is not.
 *
 * Third time the library has had to answer "which of these two nested boxes
 * gets to refract", and it lands where Slider landed: on the part that moves.
 * A tab strip's whole subject is the thing travelling between segments, and a
 * travelling lens is the one place refraction is legible — it drags the
 * background through itself as it goes. A static card lens with a flat pill
 * sliding over it is just a nicer background. So the list is a plain groove,
 * cheap the same way the slider rail is, and `Tabs.Indicator` is the surface.
 *
 * That decision has a cost the others didn't, and it is why `TabsTab` is
 * `flex-1`. The indicator's box *is* the lens's box: the kernel keys its
 * displacement map on size, so a pill that resizes as it slides asks for a new
 * map on every frame of the transition and walks the LRU cache clean on the way
 * past. Equal-width segments make that impossible — the box never changes, one
 * cached map serves every slide — which is also how a real segmented control is
 * proportioned. Only `translate` is transitioned, so if you do override the
 * width and land on uneven tabs, the pill resizes on a single frame instead of
 * interpolating through fifty sizes.
 */

const INDICATOR_GLASS = {
  radius: 11,
  blur: 1,
  refraction: 44,
  bezel: 11,
} satisfies Partial<LiquiGlassProps>;

export function Tabs({ className, ...props }: BaseTabs.Root.Props) {
  return <BaseTabs.Root {...props} className={cn('w-full', className)} />;
}

/**
 * The groove. `isolate` keeps the indicator's stacking inside the strip; it is
 * safe next to `backdrop-filter` because isolation does not make an element a
 * backdrop root in Chromium — the indicator still samples the page through it.
 */
export function TabsList({ className, ...props }: BaseTabs.List.Props) {
  return (
    <BaseTabs.List
      {...props}
      className={cn(
        'relative isolate flex w-full rounded-[14px] p-[3px]',
        'bg-[color-mix(in_srgb,var(--lq-text)_10%,transparent)]',
        'shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--lq-text)_12%,transparent),inset_0_0_0_0.5px_var(--lq-rim-lo)]',
        'data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        className,
      )}
    />
  );
}

export function TabsTab({ className, ...props }: BaseTabs.Tab.Props) {
  return (
    <BaseTabs.Tab
      {...props}
      className={cn(
        // flex-1 is load-bearing — see the note at the top of the file.
        'relative z-1 flex flex-1 cursor-default select-none items-center justify-center gap-1.5',
        'rounded-[11px] border-none bg-transparent px-3.5 py-[7px]',
        'font-[inherit] text-[13px] leading-tight font-semibold whitespace-nowrap',
        'text-[var(--lq-text-dim)] outline-none transition-colors duration-150',
        'hover:text-[var(--lq-text)] data-[active]:text-[var(--lq-text)]',
        'data-[orientation=vertical]:justify-start',
        'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
        'data-[disabled]:text-[var(--lq-text-dim)] data-[disabled]:opacity-45',
        className,
      )}
    />
  );
}

export function TabsIndicator({
  glass,
  className,
  ...props
}: BaseTabs.Indicator.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseTabs.Indicator
      {...props}
      className={cn(
        'absolute top-0 left-0 z-0 h-[var(--active-tab-height)] w-[var(--active-tab-width)]',
        // One `translate` declaration covers both orientations: horizontally
        // `--active-tab-top` is 0, vertically `--active-tab-left` is.
        '[translate:var(--active-tab-left)_var(--active-tab-top)]',
        // Only the position is interpolated. Transitioning width would resize
        // the lens frame by frame; see the note at the top of the file.
        'transition-[translate] duration-[220ms] ease-[cubic-bezier(0.3,1.05,0.35,1)]',
        className,
      )}
      // Base UI hides the indicator until it has measured the active tab, so
      // the first thing LiquiGlass measures may be a 0×0 box. It re-measures on
      // the ResizeObserver entry that fires when the strip is revealed.
      render={<LiquiGlass {...INDICATOR_GLASS} {...glass} />}
    />
  );
}

export function TabsPanel({ className, ...props }: BaseTabs.Panel.Props) {
  return (
    <BaseTabs.Panel
      {...props}
      className={cn(
        'pt-4 text-[13.5px] leading-[1.55] text-[var(--lq-text)] outline-none',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_35%,transparent)]',
        className,
      )}
    />
  );
}
