'use client';

import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Combobox — a glass field and a glass popup, and a list that is allowed
 * to change size because of *how* it changes.
 *
 * [NavigationMenu](/docs/components/navigation-menu) refuses to animate its
 * popup's size, because the displacement map is keyed on size and a 350ms
 * resize walks through a new one on every frame — 48 cache entries gone because
 * someone moved sideways. A filtered list resizes far more often than that: it
 * can move on every keystroke.
 *
 * It is nevertheless fine, and the difference is the whole point. A resize
 * *animation* produces a new size per frame, unbounded and never repeated. A
 * filtered list lands on discrete heights — one per possible number of visible
 * rows — and those repeat constantly as you type and backspace. The set is
 * small, it is capped by `max-h` on the list, and after the first pass through
 * it every height in it is a cache hit.
 *
 * So the popup is never given a height transition. Snapping is not a compromise
 * here; it is what keeps the map cache useful.
 *
 * There is no `ComboboxLabel`. Base UI's `Combobox.Label` labels the *trigger*,
 * and warns in the console when an input is the form control — so a field built
 * the way this one is wants a native `<label htmlFor>` or a
 * [Field](/docs/components/field) around it, and shipping a part that is wrong
 * for the anatomy this component ships would be worse than shipping none.
 *
 * The field is [Input](/docs/components/input)'s surface: the `<input>` stays a
 * transparent element inside the glass, because a replaced element has nowhere
 * to put the backdrop, tint and specular layers. Everything sitting in the group
 * beside it — the clear button, the open trigger, the chips — is flat, for the
 * reason [Toolbar](/docs/components/toolbar) is flat all the way through.
 */

export const Combobox = BaseCombobox.Root;
export const ComboboxCollection = BaseCombobox.Collection;
export const ComboboxRow = BaseCombobox.Row;
export const ComboboxGroup = BaseCombobox.Group;
export const ComboboxValue = BaseCombobox.Value;

const FIELD_GLASS = {
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
  <svg viewBox="0 0 12 8" width="10" height="7" fill="none" aria-hidden>
    <path
      d="M1.5 1.75 6 6.25l4.5-4.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClearIcon = (
  <svg viewBox="0 0 12 12" width="10" height="10" fill="none" aria-hidden>
    <path
      d="M2.5 2.5l7 7m0-7-7 7"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
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

/**
 * The field. One surface holding the input and whatever stands beside it —
 * `focus-within` rather than `:focus`, because the thing with focus is a child.
 */
export function ComboboxInputGroup({
  glass,
  className,
  children,
  ...props
}: BaseCombobox.InputGroup.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseCombobox.InputGroup
      {...props}
      className={cn(
        'w-full transition-shadow duration-150',
        'focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_35%,transparent)]',
        'has-[input[data-disabled]]:opacity-55',
        className,
      )}
      render={
        <LiquiGlass
          {...FIELD_GLASS}
          {...glass}
          contentClassName="flex w-full flex-wrap items-center gap-1.5 rounded-[inherit] px-2.5 py-[5px]"
        />
      }
    >
      {children}
    </BaseCombobox.InputGroup>
  );
}

export function ComboboxInput({ className, ...props }: BaseCombobox.Input.Props) {
  return (
    <BaseCombobox.Input
      {...props}
      className={cn(
        'min-w-0 flex-1 border-none bg-transparent py-1 font-[inherit] text-[13.5px] text-[var(--lq-text)] outline-none',
        'placeholder:text-[var(--lq-text-dim)]',
        'data-[disabled]:cursor-not-allowed',
        className,
      )}
    />
  );
}

/** Flat, like everything else standing on a surface that already refracts. */
const affordanceClass =
  'inline-flex size-5 flex-none cursor-default items-center justify-center rounded-md border-none bg-transparent p-0 text-[var(--lq-text-dim)] outline-none transition-[background-color,color] duration-150 hover:text-[var(--lq-text)] focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]';

export function ComboboxClear({ className, children, ...props }: BaseCombobox.Clear.Props) {
  return (
    <BaseCombobox.Clear
      aria-label="Clear"
      {...props}
      className={cn(affordanceClass, className)}
    >
      {children ?? ClearIcon}
    </BaseCombobox.Clear>
  );
}

export function ComboboxTrigger({ className, children, ...props }: BaseCombobox.Trigger.Props) {
  return (
    <BaseCombobox.Trigger
      aria-label="Open"
      {...props}
      className={cn(
        affordanceClass,
        'data-[popup-open]:text-[var(--lq-text)] [&_svg]:transition-transform [&_svg]:duration-150 data-[popup-open]:[&_svg]:rotate-180',
        className,
      )}
    >
      {children ?? ChevronIcon}
    </BaseCombobox.Trigger>
  );
}

/**
 * Chips for a multi-select field. Flat washes inside the group's lens — a chip
 * with its own bezel would be refracting the field it is sitting in.
 */
export function ComboboxChips({ className, ...props }: BaseCombobox.Chips.Props) {
  return (
    <BaseCombobox.Chips {...props} className={cn('contents', className)} />
  );
}

export function ComboboxChip({ className, children, ...props }: BaseCombobox.Chip.Props) {
  return (
    <BaseCombobox.Chip
      {...props}
      className={cn(
        'inline-flex cursor-default items-center gap-1 rounded-lg px-2 py-[3px] text-[12.5px] font-medium text-[var(--lq-text)]',
        'bg-[color-mix(in_srgb,var(--lq-highlight)_60%,transparent)]',
        'shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_60%,transparent)]',
        'data-[highlighted]:bg-[color-mix(in_srgb,var(--lq-accent)_80%,transparent)] data-[highlighted]:text-white',
        className,
      )}
    >
      {children}
    </BaseCombobox.Chip>
  );
}

export function ComboboxChipRemove({
  className,
  children,
  ...props
}: BaseCombobox.ChipRemove.Props) {
  return (
    <BaseCombobox.ChipRemove
      aria-label="Remove"
      {...props}
      className={cn(
        'inline-flex size-3.5 cursor-default items-center justify-center rounded-full border-none bg-transparent p-0 text-current opacity-60 outline-none hover:opacity-100 focus-visible:opacity-100',
        className,
      )}
    >
      {children ?? ClearIcon}
    </BaseCombobox.ChipRemove>
  );
}

export function ComboboxContent({
  children,
  glass,
  className,
  sideOffset = 6,
  ...positionerProps
}: BaseCombobox.Positioner.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner
        sideOffset={sideOffset}
        collisionPadding={12}
        {...positionerProps}
        className="z-100 outline-none"
      >
        <BaseCombobox.Popup
          className={cn(
            'w-[var(--anchor-width)] max-w-[var(--available-width)] [transform-origin:var(--transform-origin)]',
            // Opacity and the entry scale only — never height. A filtered list
            // changes size constantly, and every one of those sizes is a
            // displacement map; snapping keeps them to a small, repeating set
            // that the cache can actually hold.
            'transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.2,1.1,0.3,1)] focus:outline-none',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          // The list scrolls, so the content wrapper clips to the same radius —
          // otherwise a scrolled row squares off the popup's corners.
          render={
            <LiquiGlass
              {...POPUP_GLASS}
              {...glass}
              contentClassName="overflow-hidden rounded-[inherit]"
            />
          }
        >
          {children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

export function ComboboxList({ className, ...props }: BaseCombobox.List.Props) {
  return (
    <BaseCombobox.List
      {...props}
      className={cn(
        'max-h-[min(20rem,var(--available-height))] scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5 outline-none',
        'data-[empty]:p-0',
        className,
      )}
    />
  );
}

const itemClass =
  'group flex cursor-default select-none items-center gap-2 rounded-xl py-[7px] pr-3 pl-2 text-[13.5px] leading-tight font-[450] text-[var(--lq-text)] outline-none data-[highlighted]:bg-[var(--lq-highlight)] data-[highlighted]:shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_65%,transparent)] data-[disabled]:text-[var(--lq-text-dim)] data-[disabled]:opacity-60';

export function ComboboxItem({ children, className, ...props }: BaseCombobox.Item.Props) {
  return (
    <BaseCombobox.Item {...props} className={cn(itemClass, className)}>
      <span className="inline-flex w-4 flex-none items-center justify-center text-[var(--lq-accent)] group-data-[highlighted]:text-[var(--lq-text)]">
        <BaseCombobox.ItemIndicator className="inline-flex">
          {CheckIcon}
        </BaseCombobox.ItemIndicator>
      </span>
      <span className="truncate">{children}</span>
    </BaseCombobox.Item>
  );
}

export function ComboboxGroupLabel({ className, ...props }: BaseCombobox.GroupLabel.Props) {
  return (
    <BaseCombobox.GroupLabel
      {...props}
      className={cn(
        'px-3 pt-1.5 pb-0.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--lq-text-dim)]',
        className,
      )}
    />
  );
}

export function ComboboxSeparator({ className, ...props }: BaseCombobox.Separator.Props) {
  return (
    <BaseCombobox.Separator
      {...props}
      className={cn(
        'mx-2.5 my-[5px] h-px bg-[color-mix(in_srgb,var(--lq-text)_14%,transparent)]',
        className,
      )}
    />
  );
}

/** Shown when the filter matches nothing. */
export function ComboboxEmpty({ className, ...props }: BaseCombobox.Empty.Props) {
  return (
    <BaseCombobox.Empty
      {...props}
      className={cn(
        'px-4 py-3.5 text-[13px] text-[var(--lq-text-dim)] empty:m-0 empty:p-0',
        className,
      )}
    />
  );
}

/** A live region for "3 results", loading states and the like. */
export function ComboboxStatus({ className, ...props }: BaseCombobox.Status.Props) {
  return (
    <BaseCombobox.Status
      {...props}
      className={cn('px-4 py-2 text-[12px] text-[var(--lq-text-dim)]', className)}
    />
  );
}
