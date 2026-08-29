'use client';

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Collapsible — the lens on the part that keeps its size, frost on the
 * part that does not.
 *
 * [Accordion](/docs/components/accordion) is the same primitive with a
 * different answer, and the difference is worth stating because they look
 * alike. There, an item is one surface wrapping its own header and panel, and
 * that whole box grows: a new displacement map at every intermediate height,
 * which the library's 48-entry LRU absorbs but does not enjoy. It is accepted
 * because an accordion item *is* a card — the header and the body are one
 * object, and splitting them would leave a stack of loose parts.
 *
 * A lone disclosure is not a card. It is a control and the consequence of
 * pressing it, and separating them costs nothing — so the trigger, whose box
 * never changes, keeps the refracting surface and its map is generated once. The
 * panel is the same material at the `frost` tier, which is blur and tint with no
 * SVG filter and no canvas map behind it. Frost has nothing to regenerate, so
 * the growing box is free no matter how far it opens or how fast.
 *
 * That is also why the two do not look identical, and why they should not: the
 * trigger is the thing you can press.
 */

export const Collapsible = BaseCollapsible.Root;

const TRIGGER_GLASS = {
  radius: 14,
  blur: 1,
  refraction: 60,
  bezel: 14,
} satisfies Partial<LiquiGlassProps>;

const PANEL_GLASS = {
  material: 'frost',
  radius: 14,
  // Read by the frost tier as `blur + frost × 14`, the same formula the
  // refraction tier uses — so the panel is the trigger's material with the
  // displacement taken out, not a different one.
  blur: 1,
} satisfies Partial<LiquiGlassProps>;

export function CollapsibleTrigger({
  children,
  glass,
  className,
  ...props
}: BaseCollapsible.Trigger.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseCollapsible.Trigger
      {...props}
      // Same reason as Button: the glass anatomy is a stack of divs, and a
      // native <button> only accepts phrasing content.
      nativeButton={false}
      className={cn(
        'group flex w-full cursor-default select-none outline-none',
        'transition-[transform,box-shadow] duration-150 active:scale-[0.995]',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_35%,transparent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      render={
        <LiquiGlass
          {...TRIGGER_GLASS}
          {...glass}
          contentClassName="flex w-full items-center gap-3 rounded-[inherit] px-4 py-[11px] text-[13.5px] leading-tight font-semibold text-[var(--lq-text)] group-hover:bg-[color-mix(in_srgb,var(--lq-highlight)_35%,transparent)] group-data-[panel-open]:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)] group-data-[disabled]:bg-transparent"
        />
      }
    >
      <span className="flex-1 text-left">{children}</span>
      <svg
        viewBox="0 0 12 8"
        width="11"
        height="8"
        fill="none"
        aria-hidden
        className="flex-none opacity-55 transition-transform duration-200 ease-[cubic-bezier(0.3,0.9,0.3,1)] group-data-[panel-open]:rotate-180"
      >
        <path
          d="M1.5 1.75 6 6.25l4.5-4.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </BaseCollapsible.Trigger>
  );
}

export function CollapsiblePanel({
  children,
  glass,
  className,
  ...props
}: BaseCollapsible.Panel.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseCollapsible.Panel
      {...props}
      className={cn(
        // Height comes from Base UI's own panel measurement.
        'mt-2 h-[var(--collapsible-panel-height)] overflow-hidden',
        'transition-[height] duration-200 ease-[cubic-bezier(0.3,0.9,0.3,1)]',
        'data-[ending-style]:h-0 data-[starting-style]:h-0',
        // A closed panel carries `hidden`, and so does `hidden="until-found"` —
        // so a reset that hides everything `[hidden]` also hides the panel the
        // browser is meant to be able to find. Tailwind's preflight has scoped
        // its own rule around that since v4.1 and this line is a no-op there;
        // it is here because this file lands in projects that may have no
        // preflight, where a closed panel would otherwise stay on screen.
        "[&[hidden]:not([hidden='until-found'])]:hidden",
        className,
      )}
      render={
        <LiquiGlass
          {...PANEL_GLASS}
          {...glass}
          // The panel clips its own height, so the content wrapper has to clip
          // to the same radius — otherwise the square corners of a mid-animation
          // box punch through the surface's rounded ones.
          contentClassName="overflow-hidden rounded-[inherit]"
        />
      }
    >
      <div className="px-4 py-3 text-[13px] leading-[1.55] text-[var(--lq-text-dim)] [&_p+p]:mt-2">
        {children}
      </div>
    </BaseCollapsible.Panel>
  );
}
