'use client';

import type { ReactNode } from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui AlertDialog — the largest glass surface in the library, and the only
 * one that refracts a *dimmed* backdrop.
 *
 * That matters for tuning: the scrim sits between the popup and the page, so a
 * `frost` value that looks right on a control over bare wallpaper will read as
 * far too heavy here. Judge dialog optics against the scrim, not against the
 * other components.
 */

export const AlertDialog = BaseAlertDialog.Root;
export const AlertDialogTrigger = BaseAlertDialog.Trigger;
export const AlertDialogClose = BaseAlertDialog.Close;

const POPUP_GLASS = {
  elevated: true,
  radius: 22,
  blur: 1,
  refraction: 130,
  bezel: 30,
} satisfies Partial<LiquiGlassProps>;

export function AlertDialogContent({
  children,
  glass,
  className,
  ...popupProps
}: BaseAlertDialog.Popup.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop className="fixed inset-0 z-200 bg-[var(--lq-scrim)] backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <BaseAlertDialog.Popup
        {...popupProps}
        className={cn(
          'fixed top-1/2 left-1/2 z-201 w-95 max-w-[calc(100vw-2rem)] -translate-1/2 outline-none',
          'transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,1.05,0.3,1)]',
          'data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0',
          className,
        )}
        render={<LiquiGlass {...POPUP_GLASS} {...glass} />}
      >
        <div className="px-6 pt-[22px] pb-[18px]">{children}</div>
      </BaseAlertDialog.Popup>
    </BaseAlertDialog.Portal>
  );
}

export function AlertDialogTitle({ className, ...props }: BaseAlertDialog.Title.Props) {
  return (
    <BaseAlertDialog.Title
      {...props}
      className={cn('text-base font-bold tracking-[-0.01em] text-[var(--lq-text)]', className)}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: BaseAlertDialog.Description.Props) {
  return (
    <BaseAlertDialog.Description
      {...props}
      className={cn('mt-2 text-[13.5px] leading-[1.55] text-[var(--lq-text-dim)]', className)}
    />
  );
}

export function AlertDialogActions({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2.5">{children}</div>;
}
