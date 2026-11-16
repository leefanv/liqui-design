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
  radius: 12,
  blur: 1,
  refraction: 120,
  bezel: 20,
} satisfies Partial<LiquiGlassProps>;

const positionerClass = 'z-100 outline-none';

const popupClass =
  'min-w-58 [transform-origin:var(--transform-origin)] transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.2,1.1,0.3,1)] focus:outline-none focus-visible:outline-none data-[ending-style]:scale-85 data-[ending-style]:opacity-0 data-[starting-style]:scale-85 data-[starting-style]:opacity-0';

const itemClass =
  'flex cursor-default select-none items-center gap-2 lq-corner rounded-[var(--lq-item-radius)] min-h-6 px-2 py-[3px] text-[13px] leading-[18px] font-medium text-[var(--lq-text)] outline-none data-[highlighted]:bg-[var(--lq-accent)] data-[highlighted]:text-white data-[disabled]:text-[var(--lq-text-dim)] data-[disabled]:opacity-60';

// Checkbox and radio items reserve a 16px indicator gutter, so they start
// closer to the edge than a plain item.
const checkItemClass = `${itemClass} pl-1.5`;

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
          <div className="flex flex-col p-1.5 lq-nest [--lq-inset:6px] [--lq-item-h:24px]">{children}</div>
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
      className={cn(itemClass, variant === 'danger' && 'text-[var(--lq-danger)] data-[highlighted]:bg-[var(--lq-danger)]', className)}
    />
  );
}

export function ContextMenuSeparator() {
  return (
    <BaseContextMenu.Separator className="mx-2 my-[5px] h-px bg-[color-mix(in_srgb,var(--lq-text)_12%,transparent)]" />
  );
}

export function ContextMenuGroupLabel({ className, ...props }: BaseContextMenu.GroupLabel.Props) {
  return (
    <BaseContextMenu.GroupLabel
      {...props}
      className={cn(
        'px-2 pt-[5px] pb-1 text-[13px] leading-4 font-bold text-[var(--lq-text-dim)]',
        className,
      )}
    />
  );
}

export function ContextMenuShortcut({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto pl-5 text-[13px] tabular-nums text-[color-mix(in_srgb,var(--lq-text-dim)_70%,transparent)] in-data-[highlighted]:text-white/75">
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
  'inline-flex w-4 items-center justify-center text-[var(--lq-text)] group-data-[highlighted]:text-white';
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
        'data-[popup-open]:not-data-[highlighted]:bg-[color-mix(in_srgb,var(--lq-text)_10%,transparent)]',
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
          <div className="flex flex-col p-1.5 lq-nest [--lq-inset:6px] [--lq-item-h:24px]">{children}</div>
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}
