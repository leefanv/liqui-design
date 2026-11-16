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
 *
 * **Filtering** (Base UI 1.9, preview) wraps the menu in `MenuFilterProvider`
 * and puts a `MenuInput` above the items, which then go in a `MenuList`. The
 * input is the search field macOS puts at the top of its Help menu: flat, in
 * the popup's own corner, never a second lens inside the first. Base UI hides a
 * group with nothing left in it but cannot know about the rule above it, so
 * `MenuSection` is a group that carries its own separator, drawn only when a
 * visible section comes before it — a filtered list never opens or ends on a
 * stray line.
 */

export const Menu = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;
export const MenuGroup = BaseMenu.Group;
export const MenuRadioGroup = BaseMenu.RadioGroup;
export const MenuSub = BaseMenu.SubmenuRoot;
export const MenuFilterProvider = BaseMenu.FilterProvider;

const POPUP_GLASS = {
  elevated: true,
  radius: 12,
  blur: 1,
  refraction: 120,
  bezel: 20,
} satisfies Partial<LiquiGlassProps>;

const positionerClass = 'z-100 outline-none';

const popupClass =
  'min-w-[max(var(--anchor-width),14.5rem)] [transform-origin:var(--transform-origin)] transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.2,1.1,0.3,1)] focus:outline-none focus-visible:outline-none data-[ending-style]:scale-85 data-[ending-style]:opacity-0 data-[starting-style]:scale-85 data-[starting-style]:opacity-0';

const itemClass =
  'flex cursor-default select-none items-center gap-2 lq-corner rounded-[var(--lq-item-radius)] min-h-6 px-2 py-[3px] text-[13px] leading-[18px] font-medium text-[var(--lq-text)] outline-none data-[highlighted]:bg-[var(--lq-accent)] data-[highlighted]:text-white data-[disabled]:text-[var(--lq-text-dim)] data-[disabled]:opacity-60';

// Checkbox and radio items reserve a 16px indicator gutter, so they start
// closer to the edge than a plain item.
const checkItemClass = `${itemClass} pl-1.5`;

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
          <div className="flex flex-col p-1.5 lq-nest [--lq-inset:6px] [--lq-item-h:24px]">{children}</div>
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
      className={cn(itemClass, variant === 'danger' && 'text-[var(--lq-danger)] data-[highlighted]:bg-[var(--lq-danger)]', className)}
    />
  );
}

const separatorClass = 'mx-2 my-[5px] h-px bg-[color-mix(in_srgb,var(--lq-text)_12%,transparent)]';

export function MenuSeparator() {
  return <BaseMenu.Separator className={separatorClass} />;
}

export function MenuGroupLabel({ className, ...props }: BaseMenu.GroupLabel.Props) {
  return (
    <BaseMenu.GroupLabel
      {...props}
      className={cn(
        'px-2 pt-[5px] pb-1 text-[13px] leading-4 font-bold text-[var(--lq-text-dim)]',
        className,
      )}
    />
  );
}

export function MenuShortcut({ children }: { children: React.ReactNode }) {
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
          <div className="flex flex-col p-1.5 lq-nest [--lq-inset:6px] [--lq-item-h:24px]">{children}</div>
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

/* -------------------------------------------------------------------------- */
/* Filtering                                                                  */
/* -------------------------------------------------------------------------- */

const SearchIcon = (
  <svg viewBox="0 0 14 14" width="12" height="12" fill="none" aria-hidden>
    <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.6" />
    <path d="m9.2 9.2 3.3 3.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ClearIcon = (
  <svg viewBox="0 0 10 10" width="7" height="7" fill="none" aria-hidden>
    <path d="m2 2 6 6M8 2 2 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * The filter field. Sits in the popup's inset like an item, so it takes the
 * item corner — concentric with the glass — and is a few px taller than a row,
 * the way the field at the top of a macOS menu is.
 *
 * Base UI keeps DOM focus here while the arrow keys move a virtual highlight
 * through the list, and reports `data-highlighted` only while the field itself
 * is the active element; that is when the ring shows.
 */
export function MenuInput({ className, ...props }: BaseMenu.Input.Props) {
  return (
    <div className="relative mb-1 flex items-center text-[var(--lq-text-dim)]">
      <span className="pointer-events-none absolute left-2 flex">{SearchIcon}</span>
      <BaseMenu.Input
        {...props}
        className={cn(
          'h-7 w-full min-w-0 border-none pr-7 pl-7 font-[inherit] text-[13px] leading-[18px] font-medium text-[var(--lq-text)] outline-none',
          'lq-corner rounded-[var(--lq-item-radius)] bg-[color-mix(in_srgb,var(--lq-text)_7%,transparent)]',
          'placeholder:text-[var(--lq-text-dim)]',
          'transition-shadow duration-150 data-[highlighted]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_50%,transparent)]',
          className,
        )}
      />
      <BaseMenu.Clear
        aria-label="Clear"
        className="absolute right-1.5 inline-flex size-4 cursor-default items-center justify-center rounded-full border-none bg-[color-mix(in_srgb,var(--lq-text)_28%,transparent)] p-0 text-[var(--lq-control)] outline-none hover:bg-[color-mix(in_srgb,var(--lq-text)_45%,transparent)]"
      >
        {ClearIcon}
      </BaseMenu.Clear>
    </div>
  );
}

/**
 * The items of a filterable menu. It scrolls on its own so the field above it
 * stays put, and it is where a section's separator learns whether a visible
 * section precedes it (see `MenuSection`).
 */
export function MenuList({ className, ...props }: BaseMenu.List.Props) {
  return (
    <BaseMenu.List
      {...props}
      className={cn(
        'flex max-h-[min(20rem,var(--available-height))] flex-col overflow-y-auto overscroll-contain',
        '[&>[data-filter-section]:not([hidden])~[data-filter-section]:not([hidden])>[data-filter-separator]]:block',
        className,
      )}
    />
  );
}

/**
 * A group that brings its own leading separator, shown only after another
 * visible section. Use it in place of `MenuGroup` + `MenuSeparator` inside a
 * `MenuList`: when the query empties a section, Base UI hides the group and its
 * rule goes with it.
 */
export function MenuSection({ children, ...props }: BaseMenu.Group.Props) {
  return (
    <BaseMenu.Group {...props} data-filter-section="">
      <BaseMenu.Separator data-filter-separator="" className={cn(separatorClass, 'hidden')} />
      {children}
    </BaseMenu.Group>
  );
}

/** Shown, and announced, when the query matches nothing. */
export function MenuEmpty({ className, ...props }: BaseMenu.Empty.Props) {
  return (
    <BaseMenu.Empty
      {...props}
      className={cn('px-2 py-[5px] text-[13px] leading-[18px] text-[var(--lq-text-dim)]', className)}
    />
  );
}
