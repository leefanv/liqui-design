'use client';

import { Select as BaseSelect } from '@base-ui/react/select';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Select — a glass trigger and a glass popup, deliberately kept apart.
 *
 * Base UI's default positioning (`alignItemWithTrigger`) lays the popup *over*
 * the trigger so the selected row lines up with the value text. That is the
 * right macOS behaviour, and the wrong one for glass: the popup's backdrop then
 * includes the trigger's own tint and specular rim, so the top of the list
 * refracts a piece of UI instead of the page, and the trigger disappears under
 * a surface built to look like it. `SelectContent` therefore defaults it off
 * and drops the popup below the trigger. Pass `alignItemWithTrigger` back if
 * you want the native behaviour.
 *
 * Unlike ContextMenu, the popup here cannot be kept mounted — `Select.Portal`
 * returns `null` while closed. Reopening is still cheap: the displacement map
 * is cached by size and the SVG filter lives in a registry that outlives the
 * popup, so only the very first open pays for generation.
 */

export const Select = BaseSelect.Root;
export const SelectGroup = BaseSelect.Group;

const TRIGGER_GLASS = {
  radius: 12,
  blur: 1,
  refraction: 60,
  bezel: 12,
} satisfies Partial<LiquiGlassProps>;

const POPUP_GLASS = {
  elevated: true,
  radius: 18,
  blur: 1,
  refraction: 150,
  bezel: 28,
} satisfies Partial<LiquiGlassProps>;

const ChevronIcon = (
  <svg viewBox="0 0 10 14" width="9" height="13" fill="none" aria-hidden>
    <path
      d="M2 5.5 5 2.5l3 3M2 8.5l3 3 3-3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

export function SelectTrigger({
  children,
  glass,
  className,
  ...props
}: BaseSelect.Trigger.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseSelect.Trigger
      {...props}
      // Same reason as Button: the glass anatomy is a stack of divs, and a
      // native <button> only accepts phrasing content. Base UI supplies the
      // role, tabIndex and key handling when the native element is opted out.
      nativeButton={false}
      className={cn(
        'group inline-flex min-w-45 cursor-default select-none outline-none transition-shadow duration-150',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_35%,transparent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      render={
        <LiquiGlass
          {...TRIGGER_GLASS}
          {...glass}
          contentClassName="flex w-full items-center justify-between gap-3 rounded-[inherit] px-3 py-[9px] text-[13.5px] font-medium leading-tight group-hover:bg-[color-mix(in_srgb,var(--lq-highlight)_35%,transparent)] group-data-[popup-open]:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)] group-data-[disabled]:bg-transparent"
        />
      }
    >
      {children}
      <BaseSelect.Icon className="flex-none text-[var(--lq-text-dim)] transition-transform duration-150">
        {ChevronIcon}
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export function SelectValue({ className, ...props }: BaseSelect.Value.Props) {
  return (
    <BaseSelect.Value
      {...props}
      className={cn('truncate data-[placeholder]:text-[var(--lq-text-dim)]', className)}
    />
  );
}

export function SelectContent({
  children,
  glass,
  className,
  alignItemWithTrigger = false,
  sideOffset = 6,
  ...positionerProps
}: BaseSelect.Positioner.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        alignItemWithTrigger={alignItemWithTrigger}
        sideOffset={sideOffset}
        collisionPadding={12}
        {...positionerProps}
        className="z-100 outline-none"
      >
        <BaseSelect.Popup
          className={cn(
            'min-w-[var(--anchor-width)] [transform-origin:var(--transform-origin)]',
            'transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.2,1.1,0.3,1)] focus:outline-none',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          // The list scrolls, so the content wrapper has to clip to the same
          // radius — otherwise a scrolled row squares off the popup's corners.
          render={
            <LiquiGlass
              {...POPUP_GLASS}
              {...glass}
              contentClassName="overflow-hidden rounded-[inherit]"
            />
          }
        >
          <BaseSelect.List className="max-h-[var(--available-height)] scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5">
            {children}
          </BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

const itemClass =
  'group flex cursor-default select-none items-center gap-2 rounded-xl py-[7px] pr-3 pl-2 text-[13.5px] leading-tight font-[450] text-[var(--lq-text)] outline-none data-[highlighted]:bg-[var(--lq-highlight)] data-[highlighted]:shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_65%,transparent)] data-[disabled]:text-[var(--lq-text-dim)] data-[disabled]:opacity-60';

export function SelectItem({ children, className, ...props }: BaseSelect.Item.Props) {
  return (
    <BaseSelect.Item {...props} className={cn(itemClass, className)}>
      <span className="inline-flex w-4 flex-none items-center justify-center text-[var(--lq-accent)] group-data-[highlighted]:text-[var(--lq-text)]">
        <BaseSelect.ItemIndicator className="inline-flex transition-[opacity,transform] duration-100 data-[ending-style]:scale-[0.6] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.6] data-[starting-style]:opacity-0">
          {CheckIcon}
        </BaseSelect.ItemIndicator>
      </span>
      <BaseSelect.ItemText className="truncate">{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

export function SelectGroupLabel({ className, ...props }: BaseSelect.GroupLabel.Props) {
  return (
    <BaseSelect.GroupLabel
      {...props}
      className={cn(
        'px-3 pt-1.5 pb-0.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--lq-text-dim)]',
        className,
      )}
    />
  );
}

export function SelectSeparator() {
  return (
    <BaseSelect.Separator className="mx-2.5 my-[5px] h-px bg-[color-mix(in_srgb,var(--lq-text)_14%,transparent)]" />
  );
}
