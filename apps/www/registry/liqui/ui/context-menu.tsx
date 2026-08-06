'use client';

import * as React from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui ContextMenu — Base UI's context menu on a glass popup.
 *
 * Portals are `keepMounted` on purpose. A closed popup stays in the DOM, so its
 * filter and decoded displacement map survive close and the next open is
 * instant; without it every open pays the feImage decode window again and reads
 * as lag. (The filter registry in @liqui-design/glass makes remounts cheap too, but
 * keeping the popup mounted removes even the first-frame work.)
 *
 * The flip side, handled inside the kernel: `display:none` → shown restarts any
 * CSS animation still attached, so the refraction fade-in is cold-gated and
 * removed once played.
 */

export const ContextMenu = BaseContextMenu.Root;
export const ContextMenuTrigger = BaseContextMenu.Trigger;
export const ContextMenuGroup = BaseContextMenu.Group;
export const ContextMenuRadioGroup = BaseContextMenu.RadioGroup;
export const ContextMenuSub = BaseContextMenu.SubmenuRoot;

const POPUP_GLASS = {
  elevated: true,
  radius: 18,
  blur: 1,
  refraction: 150,
  bezel: 28,
} satisfies Partial<LiquiGlassProps>;

const positionerClass = 'z-100 outline-none';

const popupClass =
  'min-w-58 [transform-origin:var(--transform-origin)] transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.2,1.1,0.3,1)] focus:outline-none focus-visible:outline-none data-[ending-style]:scale-85 data-[ending-style]:opacity-0 data-[starting-style]:scale-85 data-[starting-style]:opacity-0';

const itemClass =
  'flex cursor-default select-none items-center gap-2 rounded-xl px-3 py-[7px] text-[13.5px] leading-tight font-[450] text-[var(--lq-text)] outline-none data-[highlighted]:bg-[var(--lq-highlight)] data-[highlighted]:shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_65%,transparent)] data-[disabled]:text-[var(--lq-text-dim)] data-[disabled]:opacity-60';

// Checkbox and radio items reserve a 16px indicator gutter, so they start
// closer to the edge than a plain item.
const checkItemClass = `${itemClass} pl-2`;

export function ContextMenuContent({
  children,
  glass,
  className,
  ...positionerProps
}: BaseContextMenu.Positioner.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseContextMenu.Portal keepMounted>
      <BaseContextMenu.Positioner
        sideOffset={6}
        collisionPadding={12}
        {...positionerProps}
        className={positionerClass}
      >
        <BaseContextMenu.Popup
          className={cn(popupClass, className)}
          render={<LiquiGlass {...POPUP_GLASS} {...glass} />}
        >
          <div className="flex flex-col p-1.5">{children}</div>
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}

export function ContextMenuItem({
  className,
  variant = 'default',
  ...props
}: BaseContextMenu.Item.Props & { variant?: 'default' | 'danger' }) {
  return (
    <BaseContextMenu.Item
      {...props}
      className={cn(itemClass, variant === 'danger' && 'text-[var(--lq-danger)]', className)}
    />
  );
}

export function ContextMenuSeparator() {
  return (
    <BaseContextMenu.Separator className="mx-2.5 my-[5px] h-px bg-[color-mix(in_srgb,var(--lq-text)_14%,transparent)]" />
  );
}

export function ContextMenuGroupLabel({ className, ...props }: BaseContextMenu.GroupLabel.Props) {
  return (
    <BaseContextMenu.GroupLabel
      {...props}
      className={cn(
        'px-3 pt-1.5 pb-0.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--lq-text-dim)]',
        className,
      )}
    />
  );
}

export function ContextMenuShortcut({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto pl-5 text-xs tracking-[0.04em] tabular-nums text-[var(--lq-text-dim)]">
      {children}
    </span>
  );
}

const CheckIcon = (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
    <path
      d="M2 6.5 4.8 9.2 10 3.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const indicatorSlotClass =
  'inline-flex w-4 items-center justify-center text-[var(--lq-accent)] group-data-[highlighted]:text-[var(--lq-text)]';
const indicatorMarkClass =
  'inline-flex transition-[opacity,transform] duration-100 data-[ending-style]:scale-[0.6] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.6] data-[starting-style]:opacity-0';

export function ContextMenuCheckboxItem({
  children,
  className,
  ...props
}: BaseContextMenu.CheckboxItem.Props) {
  return (
    <BaseContextMenu.CheckboxItem {...props} className={cn('group', checkItemClass, className)}>
      <span className={indicatorSlotClass}>
        <BaseContextMenu.CheckboxItemIndicator className={indicatorMarkClass}>
          {CheckIcon}
        </BaseContextMenu.CheckboxItemIndicator>
      </span>
      {children}
    </BaseContextMenu.CheckboxItem>
  );
}

export function ContextMenuRadioItem({
  children,
  className,
  ...props
}: BaseContextMenu.RadioItem.Props) {
  return (
    <BaseContextMenu.RadioItem {...props} className={cn('group', checkItemClass, className)}>
      <span className={indicatorSlotClass}>
        <BaseContextMenu.RadioItemIndicator className={indicatorMarkClass}>
          {CheckIcon}
        </BaseContextMenu.RadioItemIndicator>
      </span>
      {children}
    </BaseContextMenu.RadioItem>
  );
}

export function ContextMenuSubTrigger({
  children,
  className,
  ...props
}: BaseContextMenu.SubmenuTrigger.Props) {
  return (
    <BaseContextMenu.SubmenuTrigger
      {...props}
      className={cn(
        itemClass,
        'data-[popup-open]:bg-[color-mix(in_srgb,var(--lq-highlight)_55%,transparent)]',
        className,
      )}
    >
      {children}
      <svg
        viewBox="0 0 8 12"
        width="7"
        height="11"
        fill="none"
        aria-hidden
        className="ml-auto opacity-55"
      >
        <path
          d="M1.5 1.5 6 6l-4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </BaseContextMenu.SubmenuTrigger>
  );
}

export function ContextMenuSubContent({
  children,
  glass,
  className,
  ...positionerProps
}: BaseContextMenu.Positioner.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseContextMenu.Portal keepMounted>
      <BaseContextMenu.Positioner
        sideOffset={2}
        alignOffset={-6}
        collisionPadding={12}
        {...positionerProps}
        className={positionerClass}
      >
        <BaseContextMenu.Popup
          className={cn(popupClass, className)}
          // A submenu is a smaller box, so it gets a narrower bezel and softer
          // refraction — the popup defaults would over-bend at this width.
          render={<LiquiGlass {...POPUP_GLASS} refraction={110} bezel={20} {...glass} />}
        >
          <div className="flex flex-col p-1.5">{children}</div>
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}
