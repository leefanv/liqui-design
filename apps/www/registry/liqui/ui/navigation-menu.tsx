'use client';

import * as React from 'react';
import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui NavigationMenu — one strip, one popup, and a deliberate refusal to
 * animate the popup's size.
 *
 * The strip is [Menubar](/docs/components/menubar)'s: a single surface with flat
 * triggers on it, because an open item is a highlighted trigger and a highlight
 * is a wash on glass that is already there.
 *
 * The popup is where this component is unlike every other one here. Base UI
 * gives it `--popup-width` and `--popup-height` sized to the active item's
 * content, so moving from one menu to the next changes the box — and by default
 * that change is animated. On glass, animating it is the most expensive thing
 * the library can be asked to do: the displacement map is keyed on size, so a
 * 350ms resize walks through a new map on every frame and evicts all 48 entries
 * of the cache on the way past. Every other surface on the page then pays to
 * regenerate, because someone moved the pointer sideways.
 *
 * Moving, by contrast, is free. The map is keyed on size and optics and neither
 * changes when a box slides — the repo asserts exactly this in `checks.spec.ts`,
 * by dragging a surface and checking that no filter was rebuilt.
 *
 * So the two are split: the positioner transitions its *position*, and the popup
 * does not transition its *size*. The panel glides between triggers and snaps to
 * each one's dimensions, which costs one cached map per menu item — built once,
 * reused for the life of the page. The content cross-fades inside the viewport,
 * which is what carries the change instead.
 */

export const NavigationMenu = BaseNavigationMenu.Root;
export const NavigationMenuItem = BaseNavigationMenu.Item;
export const NavigationMenuIcon = BaseNavigationMenu.Icon;

const BAR_GLASS = {
  radius: 14,
  blur: 1,
  refraction: 60,
  bezel: 13,
} satisfies Partial<LiquiGlassProps>;

const POPUP_GLASS = {
  elevated: true,
  radius: 18,
  blur: 1,
  refraction: 150,
  bezel: 28,
} satisfies Partial<LiquiGlassProps>;

/** How long the panel takes to travel between triggers, and on what curve. */
const MOVE = {
  '--duration': '0.35s',
  '--easing': 'cubic-bezier(0.22, 1, 0.36, 1)',
} as React.CSSProperties;

const ARROW_OUTLINE = 'M0.5 10 L7.4 2.7 C8.8 1.2 11.2 1.2 12.6 2.7 L19.5 10';
const ARROW_H = 10;
/** `blur + frost × 14` and `0.25 + 0.75 × frost` at the popup defaults. */
const ARROW_BACKDROP = 'blur(6px) saturate(1.7)';
const ARROW_TINT =
  'color-mix(in srgb, color-mix(in srgb, var(--lq-tint), var(--lq-tint-deep)) 52%, transparent)';

export function NavigationMenuList({
  glass,
  className,
  children,
  ...props
}: BaseNavigationMenu.List.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseNavigationMenu.List
      {...props}
      className={cn('group inline-flex', className)}
      render={
        <LiquiGlass
          {...BAR_GLASS}
          {...glass}
          contentClassName="relative flex gap-0.5 rounded-[inherit] p-[3px]"
        />
      }
    >
      {children}
    </BaseNavigationMenu.List>
  );
}

const triggerClass =
  'inline-flex cursor-default select-none items-center justify-center gap-1.5 rounded-[11px] border-none bg-transparent px-[11px] py-[7px] font-[inherit] text-[13px] leading-tight font-semibold whitespace-nowrap text-[var(--lq-text)] no-underline outline-none transition-[background-color,color] duration-150 hover:not-data-disabled:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)] focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50';

export function NavigationMenuTrigger({
  children,
  className,
  ...props
}: BaseNavigationMenu.Trigger.Props) {
  return (
    <BaseNavigationMenu.Trigger
      {...props}
      className={cn(
        triggerClass,
        'data-[popup-open]:bg-[color-mix(in_srgb,var(--lq-accent)_80%,transparent)] data-[popup-open]:text-white',
        'data-[popup-open]:shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_70%,transparent)]',
        className,
      )}
    >
      {children}
      <BaseNavigationMenu.Icon className="transition-transform duration-200 data-[popup-open]:rotate-180">
        <svg viewBox="0 0 12 8" width="10" height="7" fill="none" aria-hidden className="opacity-70">
          <path
            d="M1.5 1.75 6 6.25l4.5-4.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </BaseNavigationMenu.Icon>
    </BaseNavigationMenu.Trigger>
  );
}

/** A plain item on the strip that navigates instead of opening a panel. */
export function NavigationMenuBarLink({ className, ...props }: BaseNavigationMenu.Link.Props) {
  return <BaseNavigationMenu.Link {...props} className={cn(triggerClass, className)} />;
}

/**
 * One menu's contents. Slides in from the side the pointer came from — Base UI
 * reports that as `data-activation-direction`, and it is what keeps the panel
 * feeling like one object being refilled rather than several taking turns.
 */
export function NavigationMenuContent({ className, ...props }: BaseNavigationMenu.Content.Props) {
  return (
    <BaseNavigationMenu.Content
      {...props}
      className={cn(
        'w-[calc(100vw-2rem)] max-w-[26rem] p-2 transition-[opacity,translate] duration-[var(--duration)] ease-[var(--easing)]',
        'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
        'data-[starting-style]:data-[activation-direction=left]:-translate-x-1/4',
        'data-[starting-style]:data-[activation-direction=right]:translate-x-1/4',
        'data-[ending-style]:data-[activation-direction=left]:translate-x-1/4',
        'data-[ending-style]:data-[activation-direction=right]:-translate-x-1/4',
        className,
      )}
    />
  );
}

/** A card inside a panel: a title and a line about where it goes. */
export function NavigationMenuLink({
  title,
  children,
  className,
  ...props
}: BaseNavigationMenu.Link.Props & { title: React.ReactNode }) {
  return (
    <BaseNavigationMenu.Link
      {...props}
      className={cn(
        'block cursor-default rounded-xl p-2.5 no-underline outline-none',
        'hover:bg-[var(--lq-highlight)] hover:shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_65%,transparent)]',
        'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
        className,
      )}
    >
      <span className="block text-[13.5px] leading-tight font-semibold text-[var(--lq-text)]">
        {title}
      </span>
      {children ? (
        <span className="mt-1 block text-[12.5px] leading-[1.5] text-[var(--lq-text-dim)]">
          {children}
        </span>
      ) : null}
    </BaseNavigationMenu.Link>
  );
}

export function NavigationMenuArrow({ className, ...props }: BaseNavigationMenu.Arrow.Props) {
  return (
    <BaseNavigationMenu.Arrow
      {...props}
      className={cn(
        'h-[10px] w-[20px] leading-[0] transition-[left,right] duration-[var(--duration)] ease-[var(--easing)]',
        'data-[side=bottom]:top-[-10px] data-[side=bottom]:[--lq-tail-rim:var(--lq-rim-hi)]',
        'data-[side=top]:bottom-[-10px] data-[side=top]:rotate-180 data-[side=top]:[--lq-tail-rim:var(--lq-rim-lo)]',
        'data-[side=left]:right-[-15px] data-[side=left]:rotate-90 data-[side=left]:[--lq-tail-rim:var(--lq-rim-lo)]',
        'data-[side=right]:left-[-15px] data-[side=right]:-rotate-90 data-[side=right]:[--lq-tail-rim:color-mix(in_srgb,var(--lq-rim-hi)_60%,transparent)]',
        className,
      )}
    >
      <span
        className="absolute inset-0 block"
        style={{
          clipPath: `path('${ARROW_OUTLINE} Z')`,
          backdropFilter: ARROW_BACKDROP,
          WebkitBackdropFilter: ARROW_BACKDROP,
          backgroundColor: ARROW_TINT,
        }}
      />
      <svg
        width={20}
        height={ARROW_H}
        viewBox="0 0 20 10"
        fill="none"
        aria-hidden
        className="absolute inset-0"
      >
        <path d={ARROW_OUTLINE} stroke="var(--lq-tail-rim)" strokeWidth="1" />
      </svg>
    </BaseNavigationMenu.Arrow>
  );
}

/**
 * The single panel every item shares. One surface, moved and refilled.
 *
 * Read the two transition lists together — they are the component's whole
 * argument. The positioner animates where the panel *is*; the popup animates
 * only its opacity and its entry scale, and never its width or height.
 */
export function NavigationMenuPopup({
  glass,
  className,
  arrow = true,
  sideOffset = ARROW_H,
  ...positionerProps
}: BaseNavigationMenu.Positioner.Props & {
  glass?: Partial<LiquiGlassProps>;
  arrow?: boolean;
}) {
  return (
    <BaseNavigationMenu.Portal>
      <BaseNavigationMenu.Positioner
        sideOffset={sideOffset}
        collisionPadding={{ top: 8, bottom: 8, left: 16, right: 16 }}
        collisionAvoidance={{ side: 'none' }}
        {...positionerProps}
        style={{ ...MOVE, ...positionerProps.style }}
        className={cn(
          'z-100 h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] outline-none',
          'transition-[top,left,right,bottom] duration-[var(--duration)] ease-[var(--easing)] data-[instant]:transition-none',
          // An invisible bridge across the gap, so the pointer can travel from
          // the trigger to the panel without passing over the page and closing
          // it on the way.
          "before:absolute before:content-['']",
          'data-[side=bottom]:before:top-[-10px] data-[side=bottom]:before:right-0 data-[side=bottom]:before:left-0 data-[side=bottom]:before:h-2.5',
          'data-[side=top]:before:right-0 data-[side=top]:before:bottom-[-10px] data-[side=top]:before:left-0 data-[side=top]:before:h-2.5',
        )}
      >
        <BaseNavigationMenu.Popup
          className={cn(
            'h-[var(--popup-height)] w-[var(--popup-width)] [transform-origin:var(--transform-origin)] outline-none',
            // Opacity and the entry scale only. Width and height are absent on
            // purpose: transitioning them regenerates the displacement map on
            // every frame. See the note at the top of this file.
            'transition-[opacity,transform] duration-[var(--duration)] ease-[var(--easing)]',
            'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-150',
            className,
          )}
          render={
            <LiquiGlass
              {...POPUP_GLASS}
              {...glass}
              // No `overflow-hidden` here, unlike Select's popup: the tail
              // positions itself *outside* the popup's box, so a clip on the
              // content wrapper amputates it. The viewport below does the
              // clipping instead, which is also the element that needs it —
              // it is what the panel's contents slide through.
              contentClassName="size-full rounded-[inherit]"
            />
          }
        >
          {arrow ? <NavigationMenuArrow /> : null}
          <BaseNavigationMenu.Viewport className="relative size-full overflow-hidden rounded-[inherit]" />
        </BaseNavigationMenu.Popup>
      </BaseNavigationMenu.Positioner>
    </BaseNavigationMenu.Portal>
  );
}
