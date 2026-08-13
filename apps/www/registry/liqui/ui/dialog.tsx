'use client';

import type { ReactNode } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Dialog — the dismissible modal, next to AlertDialog's insistent one.
 *
 * Optically they are the same problem: the scrim sits between the popup and the
 * page, so a `frost` tuned over bare wallpaper reads far too heavy here. Judge
 * dialog optics against the scrim.
 *
 * What is different is the dismiss button, and it is a glass constraint rather
 * than a styling choice. The button lives *inside* the popup, whose backdrop is
 * the dialog's own tint rather than the page — a `LiquiGlass` there would refract
 * the surface it is lying on and read as a smudge. Same rule as Switch's thumb
 * and Slider's rail: one surface per control gets to refract. So the dismiss is
 * a hover wash on the glass that is already there.
 */

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

const POPUP_GLASS = {
  elevated: true,
  radius: 22,
  blur: 1,
  refraction: 130,
  bezel: 30,
} satisfies Partial<LiquiGlassProps>;

export function DialogContent({
  children,
  glass,
  className,
  ...popupProps
}: BaseDialog.Popup.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-200 bg-[var(--lq-scrim)] backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <BaseDialog.Popup
        {...popupProps}
        className={cn(
          'fixed top-1/2 left-1/2 z-201 w-108 max-w-[calc(100vw-2rem)] -translate-1/2 outline-none',
          'transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,1.05,0.3,1)]',
          'data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
          className,
        )}
        render={<LiquiGlass {...POPUP_GLASS} {...glass} />}
      >
        <div className="px-6 pt-[22px] pb-[18px]">{children}</div>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({ className, ...props }: BaseDialog.Title.Props) {
  return (
    <BaseDialog.Title
      {...props}
      className={cn('text-base font-bold tracking-[-0.01em] text-[var(--lq-text)]', className)}
    />
  );
}

export function DialogDescription({ className, ...props }: BaseDialog.Description.Props) {
  return (
    <BaseDialog.Description
      {...props}
      className={cn('mt-2 text-[13.5px] leading-[1.55] text-[var(--lq-text-dim)]', className)}
    />
  );
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2.5">{children}</div>;
}

const XIcon = (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
    <path
      d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Corner dismiss. Deliberately not a liqui `Button`: it sits on the dialog's own
 * glass, and a second surface there would refract the first one. A wash and a
 * rim on the surface already present is the whole treatment.
 */
export function DialogDismiss({ className, ...props }: BaseDialog.Close.Props) {
  return (
    <BaseDialog.Close
      {...props}
      className={cn(
        'absolute top-3.5 right-3.5 inline-flex size-7 cursor-default items-center justify-center rounded-full',
        'text-[var(--lq-text-dim)] outline-none transition-[background-color,color] duration-150',
        'hover:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)] hover:text-[var(--lq-text)]',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_40%,transparent)]',
        className,
      )}
    >
      {XIcon}
      <span className="sr-only">Close</span>
    </BaseDialog.Close>
  );
}
