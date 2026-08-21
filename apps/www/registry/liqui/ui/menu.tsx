'use client';

import * as React from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Menu — Base UI's menu on a glass popup, opened from a trigger.
 *
 * The popup is the same material as ContextMenu's, and the two files are
 * deliberately not one: Base UI keeps them as separate components with separate
 * contexts, and the CLI writes one file per registry item, so sharing the item
 * classes would mean a third file that neither component works without. They
 * are copies on purpose.
 *
 * What is genuinely different here is that the popup has a *lens* to open next
 * to. A context menu appears at the pointer, over whatever the page happens to
 * be showing; a menu is anchored to a trigger that is usually a glass Button.
 * Two surfaces that overlap is the case Select had to defend against — the
 * upper one then samples the lower one's tint and specular rim instead of the
 * page, so the top of the list refracts a piece of UI and the trigger vanishes
 * under something built to look like it. `MenuContent` keeps them apart with a
 * `sideOffset` bigger than the trigger's own bezel, and aligns to the start
 * edge rather than centring on it.
 *
 * Portals are `keepMounted`, as in ContextMenu: a closed popup stays in the DOM
 * so its filter and decoded displacement map survive close, and the next open
 * is instant rather than paying the feImage decode window again.
 */

export const Menu = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;
export const MenuGroup = BaseMenu.Group;
export const MenuRadioGroup = BaseMenu.RadioGroup;
export const MenuSub = BaseMenu.SubmenuRoot;

const POPUP_GLASS = {
  elevated: true,
  radius: 18,
  blur: 1,
  refraction: 150,
  bezel: 28,
} satisfies Partial<LiquiGlassProps>;

const positionerClass = 'z-100 outline-none';

const popupClass =
  'min-w-[max(var(--anchor-width),14.5rem)] [transform-origin:var(--transform-origin)] transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.2,1.1,0.3,1)] focus:outline-none focus-visible:outline-none data-[ending-style]:scale-85 data-[ending-style]:opacity-0 data-[starting-style]:scale-85 data-[starting-style]:opacity-0';

const itemClass =
  'flex cursor-default select-none items-center gap-2 rounded-xl px-3 py-[7px] text-[13.5px] leading-tight font-[450] text-[var(--lq-text)] outline-none data-[highlighted]:bg-[var(--lq-highlight)] data-[highlighted]:shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_65%,transparent)] data-[disabled]:text-[var(--lq-text-dim)] data-[disabled]:opacity-60';

// Checkbox and radio items reserve a 16px indicator gutter, so they start
// closer to the edge than a plain item.
const checkItemClass = `${itemClass} pl-2`;

export function MenuContent({
  children,
  glass,
  className,
  // Clears the trigger's bezel. A glass popup that lands on a glass button
  // refracts the button rather than the page — see the note above.
  sideOffset = 8,
  align = 'start',
  ...positionerProps
}: BaseMenu.Positioner.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseMenu.Portal keepMounted>
      <BaseMenu.Positioner
        sideOffset={sideOffset}
        align={align}
        collisionPadding={12}
        {...positionerProps}
        className={positionerClass}
      >
        <BaseMenu.Popup
          className={cn(popupClass, className)}
          render={<LiquiGlass {...POPUP_GLASS} {...glass} />}
        >
          <div className="flex flex-col p-1.5">{children}</div>
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function MenuItem({
  className,
  variant = 'default',
  ...props
}: BaseMenu.Item.Props & { variant?: 'default' | 'danger' }) {
  return (
    <BaseMenu.Item
      {...props}
      className={cn(itemClass, variant === 'danger' && 'text-[var(--lq-danger)]', className)}
    />
  );
}

export function MenuSeparator() {
  return (
    <BaseMenu.Separator className="mx-2.5 my-[5px] h-px bg-[color-mix(in_srgb,var(--lq-text)_14%,transparent)]" />
  );
}

export function MenuGroupLabel({ className, ...props }: BaseMenu.GroupLabel.Props) {
  return (
    <BaseMenu.GroupLabel
      {...props}
      className={cn(
        'px-3 pt-1.5 pb-0.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--lq-text-dim)]',
        className,
      )}
    />
  );
}

export function MenuShortcut({ children }: { children: React.ReactNode }) {
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

export function MenuCheckboxItem({
  children,
  className,
  ...props
}: BaseMenu.CheckboxItem.Props) {
  return (
    <BaseMenu.CheckboxItem {...props} className={cn('group', checkItemClass, className)}>
      <span className={indicatorSlotClass}>
        <BaseMenu.CheckboxItemIndicator className={indicatorMarkClass}>
          {CheckIcon}
        </BaseMenu.CheckboxItemIndicator>
      </span>
      {children}
    </BaseMenu.CheckboxItem>
  );
}

export function MenuRadioItem({ children, className, ...props }: BaseMenu.RadioItem.Props) {
  return (
    <BaseMenu.RadioItem {...props} className={cn('group', checkItemClass, className)}>
      <span className={indicatorSlotClass}>
        <BaseMenu.RadioItemIndicator className={indicatorMarkClass}>
          {CheckIcon}
        </BaseMenu.RadioItemIndicator>
      </span>
      {children}
    </BaseMenu.RadioItem>
  );
}

export function MenuSubTrigger({
  children,
  className,
  ...props
}: BaseMenu.SubmenuTrigger.Props) {
  return (
    <BaseMenu.SubmenuTrigger
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
    </BaseMenu.SubmenuTrigger>
  );
}

export function MenuSubContent({
  children,
  glass,
  className,
  ...positionerProps
}: BaseMenu.Positioner.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseMenu.Portal keepMounted>
      <BaseMenu.Positioner
        sideOffset={2}
        alignOffset={-6}
        collisionPadding={12}
        {...positionerProps}
        className={positionerClass}
      >
        <BaseMenu.Popup
          className={cn(popupClass, 'min-w-52', className)}
          // A submenu is a smaller box, so it gets a narrower bezel and softer
          // refraction — the popup defaults would over-bend at this width.
          render={<LiquiGlass {...POPUP_GLASS} refraction={110} bezel={20} {...glass} />}
        >
          <div className="flex flex-col p-1.5">{children}</div>
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}
