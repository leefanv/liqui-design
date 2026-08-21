'use client';

import * as React from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Menubar as BaseMenubar } from '@base-ui/react/menubar';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';
import { MenuContent } from '@/registry/liqui/ui/menu';

/**
 * liqui Menubar — one glass strip holding several menus.
 *
 * The strip is the surface and the triggers are flat, which is ToggleGroup's
 * answer rather than Tabs': a menubar has no single travelling element to hang
 * the lens on — an open menu is a highlighted trigger, and a highlighted
 * trigger is a wash on glass that is already there. Nesting a second lens
 * inside the strip would only bend the strip.
 *
 * The popups are Menu's, imported rather than restated: a menubar *is* a row of
 * menus, and `Menubar` only supplies the shared open/close behaviour. That is
 * why installing this component installs `menu` too.
 *
 * One thing changes about the popup. A menu normally hangs off a button and has
 * to clear that button's bezel, because two glass surfaces that overlap make
 * the upper one refract the lower. Here the anchor is a *flat* trigger inside
 * the strip, so the gap only has to clear the strip's own edge — `MenubarContent`
 * ships a smaller `sideOffset` for that, and it is why these popups sit closer
 * to their anchor than a standalone menu's does.
 */

export { MenuItem as MenubarItem } from '@/registry/liqui/ui/menu';
export { MenuSeparator as MenubarSeparator } from '@/registry/liqui/ui/menu';
export { MenuGroup as MenubarGroup } from '@/registry/liqui/ui/menu';
export { MenuGroupLabel as MenubarGroupLabel } from '@/registry/liqui/ui/menu';
export { MenuShortcut as MenubarShortcut } from '@/registry/liqui/ui/menu';
export { MenuCheckboxItem as MenubarCheckboxItem } from '@/registry/liqui/ui/menu';
export { MenuRadioGroup as MenubarRadioGroup } from '@/registry/liqui/ui/menu';
export { MenuRadioItem as MenubarRadioItem } from '@/registry/liqui/ui/menu';
export { MenuSub as MenubarSub } from '@/registry/liqui/ui/menu';
export { MenuSubTrigger as MenubarSubTrigger } from '@/registry/liqui/ui/menu';
export { MenuSubContent as MenubarSubContent } from '@/registry/liqui/ui/menu';

const BAR_GLASS = {
  radius: 14,
  blur: 1,
  refraction: 60,
  bezel: 13,
} satisfies Partial<LiquiGlassProps>;

export interface MenubarProps extends BaseMenubar.Props {
  /** Overrides for the underlying glass strip (radius, refraction, bezel…). */
  glass?: Partial<LiquiGlassProps>;
}

export function Menubar({ glass, className, children, ...props }: MenubarProps) {
  return (
    <BaseMenubar
      {...props}
      className={cn('group inline-flex', className)}
      render={
        <LiquiGlass
          {...BAR_GLASS}
          {...glass}
          contentClassName="flex gap-0.5 rounded-[inherit] p-[3px] group-data-[orientation=vertical]:flex-col"
        />
      }
    >
      {children}
    </BaseMenubar>
  );
}

/** A menu inside the bar. Base UI's menu root; the bar coordinates them. */
export const MenubarMenu = BaseMenu.Root;

/**
 * The popup. `sideOffset` is smaller than a standalone menu's, because the
 * anchor is a flat trigger inside the strip rather than a glass button — the
 * gap only has to clear the strip's edge, not another lens.
 */
export function MenubarContent({
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof MenuContent>) {
  return <MenuContent sideOffset={sideOffset} {...props} />;
}

export function MenubarTrigger({ className, ...props }: BaseMenu.Trigger.Props) {
  return (
    <BaseMenu.Trigger
      {...props}
      className={cn(
        // Keeps the native <button>: there is no glass anatomy to put inside it
        // here, so none of the reasons Button has to opt out apply.
        'inline-flex cursor-default select-none items-center justify-center gap-[7px]',
        'rounded-[11px] border-none bg-transparent px-[11px] py-[7px]',
        'font-[inherit] text-[13px] leading-tight font-semibold whitespace-nowrap',
        'text-[var(--lq-text)] outline-none transition-[background-color,color] duration-150',
        'hover:not-data-disabled:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)]',
        'data-[popup-open]:bg-[color-mix(in_srgb,var(--lq-accent)_80%,transparent)] data-[popup-open]:text-white',
        'data-[popup-open]:shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_70%,transparent)]',
        'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
    />
  );
}
