'use client';

import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Tooltip — the smallest floating surface in the library, and the one
 * that has to stay readable over anything.
 *
 * Two things follow from the size. The optics are scaled right down (a 28px-tall
 * chip driven at a menu's `refraction: 150` is all bezel and no glass), and
 * `frost` is raised well above the library default: a tooltip is a line of small
 * text with no container of its own, and at the default 0.35 it inherits
 * whatever contrast the wallpaper happens to give it. 0.7 is roughly Apple's
 * "regular" material — still glass, still refracting, but carrying its own
 * legibility.
 *
 * No tail, and that is the third thing the size decides. A tail can wear the
 * popup's blur and tint (Popover's does) but it cannot wear the kernel's
 * specular layer, which is an image generated for the surface's own box. On a
 * panel that gap is a few px along one edge of something large. On a 28px chip
 * it is most of the join: the tail reads darker than the edge it hangs off, and
 * the seam is more noticeable than the pointing it was there to do.
 */

export const TooltipProvider = BaseTooltip.Provider;
export const Tooltip = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;

const POPUP_GLASS = {
  elevated: true,
  radius: 11,
  blur: 1,
  refraction: 35,
  bezel: 9,
  frost: 0.7,
} satisfies Partial<LiquiGlassProps>;

export function TooltipContent({
  children,
  glass,
  className,
  sideOffset = 6,
  ...positionerProps
}: BaseTooltip.Positioner.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        sideOffset={sideOffset}
        collisionPadding={12}
        {...positionerProps}
        className="z-150 outline-none"
      >
        <BaseTooltip.Popup
          className={cn(
            'max-w-64 [transform-origin:var(--transform-origin)]',
            'transition-[transform,opacity] duration-100 ease-[cubic-bezier(0.2,1.1,0.3,1)]',
            'data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0',
            // Base UI sets data-instant when the tooltip is shown without its
            // delay (moving between triggers in a group, or focus).
            'data-[instant]:duration-0',
            className,
          )}
          render={
            <LiquiGlass
              {...POPUP_GLASS}
              {...glass}
              contentClassName="px-2.5 py-[5px] text-[12.5px] leading-[1.4] font-medium text-[var(--lq-text)]"
            />
          }
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
