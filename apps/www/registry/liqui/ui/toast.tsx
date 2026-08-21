'use client';

import * as React from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Toast — notifications in a column, deliberately not a stack.
 *
 * Base UI's default arrangement overlaps them: the newest sits in front, the
 * older ones scale down behind it and peek out by a few pixels. For opaque
 * cards that is the right look and it is what the platform does. For glass it
 * cannot work, and not subtly — `backdrop-filter` samples whatever is painted
 * behind an element, so the front toast's backdrop *is* the card behind it over
 * almost its whole box. It would refract a flat tint instead of the page, which
 * is the same failure as putting a surface on a flat fill: the lens goes dead
 * and the newest, most important toast is the one that loses it.
 *
 * So the toasts are laid out down the viewport with a real gap between them.
 * Every surface has the page behind it, every surface refracts, and the gap is
 * not decoration — it is the thing that makes the material work. `limit` on the
 * provider (3 by default) is what keeps a column from becoming a wall.
 *
 * Transforms are free here. The kernel measures with `ResizeObserver` and
 * `offsetWidth`, both layout sizes, so a toast can slide and scale through its
 * entrance without disturbing the displacement map — the map is keyed on the
 * layout box, which never changed.
 */

export const ToastProvider = BaseToast.Provider;
export const useToast = BaseToast.useToastManager;

const TOAST_GLASS = {
  elevated: true,
  radius: 18,
  blur: 1,
  refraction: 130,
  bezel: 26,
} satisfies Partial<LiquiGlassProps>;

/** Vertical gap between toasts. Referenced by the transform and the hover bridge. */
const GAP = '0.75rem';

export function Toast({
  toast,
  glass,
  children,
  className,
  ...props
}: BaseToast.Root.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseToast.Root
      toast={toast}
      {...props}
      style={{ '--gap': GAP } as React.CSSProperties}
      className={cn(
        'absolute right-0 bottom-0 left-auto w-full origin-bottom select-none',
        'z-[calc(1000-var(--toast-index))]',
        // Every toast sits above the ones before it: their measured heights
        // (`--toast-offset-y`) plus one gap each. Base UI keeps this var up to
        // date whether or not the viewport is hovered, which is what lets the
        // column exist without an expanded state.
        '[--offset-y:calc(var(--toast-offset-y)*-1+(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))]',
        '[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]',
        'transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        // Dragging has to track the pointer, not ease towards it.
        'data-[swiping]:transition-none',
        'data-[starting-style]:[transform:translateY(150%)]',
        'data-[limited]:opacity-0',
        'data-[ending-style]:opacity-0',
        'data-[ending-style]:[transform:translateY(150%)]',
        'data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]',
        'data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
        'data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]',
        'data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]',
        // Bridges the gap to the toast below, so moving the pointer up the
        // column never leaves the viewport and restarts the dismiss timers.
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
        className,
      )}
      render={<LiquiGlass {...TOAST_GLASS} {...glass} />}
    >
      <BaseToast.Content className="flex items-start gap-3 px-4 py-3.5">{children}</BaseToast.Content>
    </BaseToast.Root>
  );
}

export function ToastTitle({ className, ...props }: BaseToast.Title.Props) {
  return (
    <BaseToast.Title
      {...props}
      className={cn(
        'text-[13.5px] font-bold tracking-[-0.005em] text-[var(--lq-text)]',
        className,
      )}
    />
  );
}

export function ToastDescription({ className, ...props }: BaseToast.Description.Props) {
  return (
    <BaseToast.Description
      {...props}
      className={cn('mt-1 text-[13px] leading-[1.5] text-[var(--lq-text-dim)]', className)}
    />
  );
}

/**
 * The action button. Flat, like every control that lives *on* a glass surface:
 * its backdrop is the toast's own tint, so a lens here would bend the card it
 * is lying on. Same rule as the dialog's dismiss.
 */
export function ToastAction({ className, ...props }: BaseToast.Action.Props) {
  return (
    <BaseToast.Action
      {...props}
      className={cn(
        'mt-2.5 inline-flex cursor-default items-center justify-center rounded-lg px-2.5 py-1.5',
        'text-xs font-semibold text-[var(--lq-accent)] outline-none',
        'transition-[background-color] duration-150',
        'hover:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)]',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
        className,
      )}
    />
  );
}

const XIcon = (
  <svg viewBox="0 0 12 12" width="10" height="10" fill="none" aria-hidden>
    <path
      d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

export function ToastClose({ className, ...props }: BaseToast.Close.Props) {
  return (
    <BaseToast.Close
      {...props}
      className={cn(
        'ml-auto inline-flex size-6 flex-none cursor-default items-center justify-center rounded-full',
        'text-[var(--lq-text-dim)] outline-none transition-[background-color,color] duration-150',
        'hover:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)] hover:text-[var(--lq-text)]',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
        className,
      )}
    >
      {XIcon}
      <span className="sr-only">Close</span>
    </BaseToast.Close>
  );
}

/**
 * The whole viewport, ready to drop next to your app inside a `ToastProvider`.
 * It renders the default body — title, description, optional action, dismiss —
 * for every toast the manager is holding. Rewrite the map for a custom shape;
 * the file is yours.
 */
export function Toaster({
  glass,
  className,
  ...props
}: BaseToast.Viewport.Props & { glass?: Partial<LiquiGlassProps> }) {
  const { toasts } = BaseToast.useToastManager();

  return (
    <BaseToast.Portal>
      <BaseToast.Viewport
        {...props}
        className={cn(
          'fixed right-4 bottom-4 z-300 w-[calc(100vw-2rem)] outline-none sm:right-6 sm:bottom-6 sm:w-90',
          className,
        )}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} glass={glass}>
            <div className="min-w-0 flex-1">
              <ToastTitle />
              <ToastDescription />
              {toast.actionProps ? <ToastAction /> : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}
