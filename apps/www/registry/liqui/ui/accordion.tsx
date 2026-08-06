'use client';

import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Accordion — every item is its own glass surface.
 *
 * This is the library's stress test for glass on an animating box. The surface
 * grows and shrinks with the panel, so the displacement map is regenerated at
 * each new size (the module-wide cache in @liqui-design/glass keeps that from being a
 * per-frame cost, but it is the reason the map cache exists at all).
 *
 * The panel animates height by clipping, so the glass content wrapper has to
 * carry `overflow-hidden` and inherit the radius — otherwise the panel's square
 * corners punch through the surface's rounded ones mid-animation.
 */

const ITEM_GLASS = {
  radius: 18,
  blur: 1,
  refraction: 110,
  bezel: 22,
} satisfies Partial<LiquiGlassProps>;

export function Accordion({ className, ...props }: BaseAccordion.Root.Props) {
  return (
    <BaseAccordion.Root {...props} className={cn('flex w-full flex-col gap-2.5', className)} />
  );
}

export function AccordionItem({
  glass,
  children,
  className,
  ...props
}: BaseAccordion.Item.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseAccordion.Item
      {...props}
      className={className}
      render={
        <LiquiGlass
          {...ITEM_GLASS}
          {...glass}
          contentClassName="overflow-hidden rounded-[inherit]"
        />
      }
    >
      {children}
    </BaseAccordion.Item>
  );
}

export function AccordionTrigger({ children, className, ...props }: BaseAccordion.Trigger.Props) {
  return (
    <BaseAccordion.Header className="m-0">
      <BaseAccordion.Trigger
        {...props}
        className={cn(
          'group flex w-full cursor-default items-center gap-3 border-none bg-transparent px-4 py-[13px] text-left font-[inherit] text-[13.5px] font-semibold text-[var(--lq-text)] outline-none',
          'hover:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)]',
          'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
          className,
        )}
      >
        <span className="flex-1">{children}</span>
        <svg
          viewBox="0 0 12 8"
          width="11"
          height="8"
          fill="none"
          aria-hidden
          className="opacity-55 transition-transform duration-200 ease-[cubic-bezier(0.3,0.9,0.3,1)] group-data-[panel-open]:rotate-180"
        >
          <path
            d="M1.5 1.75 6 6.25l4.5-4.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

export function AccordionPanel({ children, className, ...props }: BaseAccordion.Panel.Props) {
  return (
    <BaseAccordion.Panel
      {...props}
      className={cn(
        // Height comes from Base UI's own panel measurement, which is also what
        // makes the glass surface resize and the bezel follow the new box.
        'h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-[cubic-bezier(0.3,0.9,0.3,1)]',
        'data-[ending-style]:h-0 data-[starting-style]:h-0',
        className,
      )}
    >
      <div className="px-4 pb-3.5 text-[13px] leading-[1.55] text-[var(--lq-text-dim)] [&_p+p]:mt-2">
        {children}
      </div>
    </BaseAccordion.Panel>
  );
}
