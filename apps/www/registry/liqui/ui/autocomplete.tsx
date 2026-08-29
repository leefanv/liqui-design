'use client';

import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Autocomplete — [Combobox](/docs/components/combobox)'s surfaces on a
 * field whose value is the text you typed.
 *
 * The two are separate Base UI primitives and they are separate files here, for
 * the reason Menu and ContextMenu are: a registry item is one file, and sharing
 * the classes would mean a third item that neither component works without.
 * What differs is what the control is *for*. A combobox picks an item out of a
 * set and remembers which one; an autocomplete suggests completions for a string
 * and hands you the string. So there is no `ItemIndicator` here and no check
 * gutter to reserve — nothing in the list is ever "the current one" — and the
 * rows sit flush instead.
 *
 * The optics argument is Combobox's, unchanged and if anything sharper: this
 * popup opens *while* you type, so it resizes constantly. That stays cheap for
 * the reason written out on that page — a filtered list lands on a small set of
 * discrete heights that repeat, and every one of them after the first pass is a
 * cache hit, whereas a resize *animation* would produce a new displacement map
 * on every frame. Which is why nothing here transitions height.
 */

export const Autocomplete = BaseAutocomplete.Root;
export const AutocompleteCollection = BaseAutocomplete.Collection;
export const AutocompleteRow = BaseAutocomplete.Row;
export const AutocompleteGroup = BaseAutocomplete.Group;
export const AutocompleteValue = BaseAutocomplete.Value;

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
    <path d="M2.5 2.5l7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/**
 * The field. One surface holding the input and whatever stands beside it —
 * `focus-within` rather than `:focus`, because the thing with focus is a child.
 */
export function AutocompleteInputGroup({
  glass,
  className,
  children,
  ...props
}: BaseAutocomplete.InputGroup.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseAutocomplete.InputGroup
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
          contentClassName="flex w-full items-center gap-1.5 rounded-[inherit] px-2.5 py-[5px]"
        />
      }
    >
      {children}
    </BaseAutocomplete.InputGroup>
  );
}

export function AutocompleteInput({ className, ...props }: BaseAutocomplete.Input.Props) {
  return (
    <BaseAutocomplete.Input
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

export function AutocompleteClear({ className, children, ...props }: BaseAutocomplete.Clear.Props) {
  return (
    <BaseAutocomplete.Clear aria-label="Clear" {...props} className={cn(affordanceClass, className)}>
      {children ?? ClearIcon}
    </BaseAutocomplete.Clear>
  );
}

export function AutocompleteTrigger({
  className,
  children,
  ...props
}: BaseAutocomplete.Trigger.Props) {
  return (
    <BaseAutocomplete.Trigger
      aria-label="Open"
      {...props}
      className={cn(
        affordanceClass,
        'data-[popup-open]:text-[var(--lq-text)] [&_svg]:transition-transform [&_svg]:duration-150 data-[popup-open]:[&_svg]:rotate-180',
        className,
      )}
    >
      {children ?? ChevronIcon}
    </BaseAutocomplete.Trigger>
  );
}

export function AutocompleteContent({
  children,
  glass,
  className,
  sideOffset = 6,
  ...positionerProps
}: BaseAutocomplete.Positioner.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseAutocomplete.Portal>
      <BaseAutocomplete.Positioner
        sideOffset={sideOffset}
        collisionPadding={12}
        {...positionerProps}
        className="z-100 outline-none"
      >
        <BaseAutocomplete.Popup
          className={cn(
            'w-[var(--anchor-width)] max-w-[var(--available-width)] [transform-origin:var(--transform-origin)]',
            // Opacity and the entry scale only — never height. See the note at
            // the top of this file.
            'transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.2,1.1,0.3,1)] focus:outline-none',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          render={
            <LiquiGlass
              {...POPUP_GLASS}
              {...glass}
              contentClassName="overflow-hidden rounded-[inherit]"
            />
          }
        >
          {children}
        </BaseAutocomplete.Popup>
      </BaseAutocomplete.Positioner>
    </BaseAutocomplete.Portal>
  );
}

export function AutocompleteList({ className, ...props }: BaseAutocomplete.List.Props) {
  return (
    <BaseAutocomplete.List
      {...props}
      className={cn(
        'max-h-[min(20rem,var(--available-height))] scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5 outline-none',
        'data-[empty]:p-0',
        className,
      )}
    />
  );
}

/** No indicator gutter: nothing in a suggestion list is "the current one". */
export function AutocompleteItem({ className, ...props }: BaseAutocomplete.Item.Props) {
  return (
    <BaseAutocomplete.Item
      {...props}
      className={cn(
        'flex cursor-default select-none items-center gap-2 rounded-xl px-3 py-[7px] text-[13.5px] leading-tight font-[450] text-[var(--lq-text)] outline-none',
        'data-[highlighted]:bg-[var(--lq-highlight)] data-[highlighted]:shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_65%,transparent)]',
        'data-[disabled]:text-[var(--lq-text-dim)] data-[disabled]:opacity-60',
        className,
      )}
    />
  );
}

export function AutocompleteGroupLabel({
  className,
  ...props
}: BaseAutocomplete.GroupLabel.Props) {
  return (
    <BaseAutocomplete.GroupLabel
      {...props}
      className={cn(
        'px-3 pt-1.5 pb-0.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--lq-text-dim)]',
        className,
      )}
    />
  );
}

export function AutocompleteSeparator({ className, ...props }: BaseAutocomplete.Separator.Props) {
  return (
    <BaseAutocomplete.Separator
      {...props}
      className={cn(
        'mx-2.5 my-[5px] h-px bg-[color-mix(in_srgb,var(--lq-text)_14%,transparent)]',
        className,
      )}
    />
  );
}

/** Shown when the filter matches nothing. */
export function AutocompleteEmpty({ className, ...props }: BaseAutocomplete.Empty.Props) {
  return (
    <BaseAutocomplete.Empty
      {...props}
      className={cn(
        'px-4 py-3.5 text-[13px] text-[var(--lq-text-dim)] empty:m-0 empty:p-0',
        className,
      )}
    />
  );
}

/** A live region for "3 results", loading states and the like. */
export function AutocompleteStatus({ className, ...props }: BaseAutocomplete.Status.Props) {
  return (
    <BaseAutocomplete.Status
      {...props}
      className={cn('px-4 py-2 text-[12px] text-[var(--lq-text-dim)]', className)}
    />
  );
}
