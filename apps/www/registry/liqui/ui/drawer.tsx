'use client';

import * as React from 'react';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Drawer — the largest surface in the library, and one of the cheapest.
 *
 * A sheet is a big box, and a big box sounds expensive: the displacement map is
 * generated per pixel on a canvas. Two things make it not.
 *
 * The kernel renders maps for large surfaces at *half* resolution — displacement
 * vectors and the specular glow are smooth fields, so stretching them back up is
 * invisible, and generation plus PNG decode get roughly four times cheaper. And
 * a drawer only ever has one size per side, so after the first open it is a
 * cache hit for the life of the page.
 *
 * The swipe is free for the same reason [Slider](/docs/components/slider)'s
 * thumb is: dragging translates the sheet, and the map is keyed on size and
 * optics, neither of which a translate touches. The repo asserts this directly
 * in `checks.spec.ts`. So a sheet can be dragged at 120Hz with the filter
 * untouched — which is exactly what a swipe-to-dismiss needs, because the
 * gesture is the one moment a rebuild would be visible as lag.
 *
 * The scrim goes underneath, as it does for [Dialog](/docs/components/dialog),
 * and it changes what the sheet is refracting. Judge drawer optics against a
 * dimmed page, never against bare wallpaper.
 */

export const Drawer = BaseDrawer.Root;
export const DrawerTrigger = BaseDrawer.Trigger;
export const DrawerClose = BaseDrawer.Close;
export const DrawerProvider = BaseDrawer.Provider;
export const DrawerViewport = BaseDrawer.Viewport;
export const DrawerSwipeArea = BaseDrawer.SwipeArea;
export const createDrawerHandle = BaseDrawer.createHandle;

const SHEET_GLASS = {
  elevated: true,
  radius: 26,
  blur: 1,
  refraction: 150,
  bezel: 34,
} satisfies Partial<LiquiGlassProps>;

export type DrawerSide = 'bottom' | 'top' | 'left' | 'right';

/**
 * Where the sheet rests and which way it leaves, written out per side.
 *
 * Literal strings rather than anything composed at runtime: Tailwind reads the
 * source, so a class built from a variable — `` `data-[ending-style]:${x}` `` —
 * is a class that never reaches the stylesheet. The repetition is the price of
 * that, and it is cheaper than the bug.
 */
const SIDE: Record<DrawerSide, { viewport: string; popup: string }> = {
  bottom: {
    viewport: 'items-end justify-center',
    popup:
      'w-full max-w-[36rem] max-h-[85dvh] translate-y-[var(--drawer-swipe-movement-y)] data-[starting-style]:translate-y-[calc(100%+1rem)] data-[ending-style]:translate-y-[calc(100%+1rem)]',
  },
  top: {
    viewport: 'items-start justify-center',
    popup:
      'w-full max-w-[36rem] max-h-[85dvh] translate-y-[var(--drawer-swipe-movement-y)] data-[starting-style]:translate-y-[calc(-100%-1rem)] data-[ending-style]:translate-y-[calc(-100%-1rem)]',
  },
  left: {
    viewport: 'items-stretch justify-start',
    popup:
      'h-full w-[22rem] max-w-[calc(100vw-2rem)] translate-x-[var(--drawer-swipe-movement-x)] data-[starting-style]:translate-x-[calc(-100%-1rem)] data-[ending-style]:translate-x-[calc(-100%-1rem)]',
  },
  right: {
    viewport: 'items-stretch justify-end',
    popup:
      'h-full w-[22rem] max-w-[calc(100vw-2rem)] translate-x-[var(--drawer-swipe-movement-x)] data-[starting-style]:translate-x-[calc(100%+1rem)] data-[ending-style]:translate-x-[calc(100%+1rem)]',
  },
};

export function DrawerContent({
  children,
  side = 'bottom',
  glass,
  className,
  ...popupProps
}: BaseDrawer.Popup.Props & {
  /** Which edge the sheet rests against. Pair it with the root's `swipeDirection`. */
  side?: DrawerSide;
  glass?: Partial<LiquiGlassProps>;
}) {
  const layout = SIDE[side];

  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop
        className={cn(
          'fixed inset-0 z-200 bg-[var(--lq-scrim)] backdrop-blur-[2px]',
          // The scrim tracks the gesture: swipe the sheet halfway out and the
          // page behind it is already half back. `data-[swiping]:duration-0`
          // is what keeps it on the finger rather than 450ms behind it.
          'opacity-[calc(1-var(--drawer-swipe-progress))]',
          'transition-[opacity] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:duration-0',
          'data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
        )}
      />
      <BaseDrawer.Viewport className={cn('fixed inset-0 z-201 flex p-3', layout.viewport)}>
        <BaseDrawer.Popup
          {...popupProps}
          className={cn(
            'flex touch-auto flex-col overflow-hidden outline-none',
            layout.popup,
            // Transform only. Nothing here animates width or height: those are
            // the two properties the displacement map is keyed on, and a sheet
            // that resized as it moved would build a new map per frame.
            'transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
            'data-[swiping]:select-none data-[swiping]:duration-0',
            className,
          )}
          render={
            <LiquiGlass
              {...SHEET_GLASS}
              {...glass}
              contentClassName="flex size-full flex-col overflow-hidden rounded-[inherit]"
            />
          }
        >
          {children}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

/**
 * The grab bar. A flat pill rather than a small surface — a lens this size
 * inside a sheet would be bending the sheet, which is the same reason the
 * dialog's dismiss is a wash.
 */
export function DrawerHandle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      {...props}
      className={cn('flex flex-none justify-center pt-2.5 pb-1', className)}
    >
      <span className="h-1 w-9 rounded-full bg-[color-mix(in_srgb,var(--lq-text)_22%,transparent)]" />
    </div>
  );
}

export function DrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <BaseDrawer.Content
      {...props}
      className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-4 pb-6', className)}
    />
  );
}

export function DrawerTitle({ className, ...props }: BaseDrawer.Title.Props) {
  return (
    <BaseDrawer.Title
      {...props}
      className={cn('text-base font-bold tracking-[-0.01em] text-[var(--lq-text)]', className)}
    />
  );
}

export function DrawerDescription({ className, ...props }: BaseDrawer.Description.Props) {
  return (
    <BaseDrawer.Description
      {...props}
      className={cn('mt-2 text-[13.5px] leading-[1.55] text-[var(--lq-text-dim)]', className)}
    />
  );
}
