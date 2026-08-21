'use client';

import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui NumberField — one glass group holding an input and two steppers.
 *
 * The group is the surface, and everything inside it is flat. That is the same
 * decision the dialog's dismiss and the toggle group's toggles make: a control
 * sitting inside a glass box has that box's tint behind it rather than the
 * page, so a lens there bends the surface it is lying on and reads as a smudge.
 * Three lenses in a 200px-wide box would be three smudges.
 *
 * The input is a transparent `<input>` in the content layer, as in
 * [Field](../ui/field.tsx) — making the input itself the glass root would put
 * the backdrop and tint layers inside a replaced element, where they cannot
 * render at all.
 *
 * The steppers are dividers rather than buttons: a hairline, a hover wash, and
 * nothing else. A raised key inside the group would need its own shadow to look
 * raised, and a shadow on top of glass is the one thing the material has no way
 * to sit under.
 *
 * `ScrubArea` is the reason the label is a part rather than a `<label>` you
 * bring. Dragging it changes the value, and the cursor is hidden and teleported
 * while you do — that only works on an element Base UI controls.
 */

const GROUP_GLASS = {
  radius: 12,
  blur: 1,
  refraction: 60,
  bezel: 12,
} satisfies Partial<LiquiGlassProps>;

export function NumberField({ className, ...props }: BaseNumberField.Root.Props) {
  return (
    <BaseNumberField.Root {...props} className={cn('flex flex-col gap-1.5', className)} />
  );
}

/**
 * The label, doubling as a scrub handle: drag it left and right to change the
 * value. Base UI hides the pointer during the drag and draws the arrow cursor
 * below in its place, which is why the label is a part here rather than a
 * `<label>` you bring — `htmlFor` still points it at the input.
 */
export function NumberFieldLabel({
  children,
  className,
  htmlFor,
  ...props
}: BaseNumberField.ScrubArea.Props & {
  /** The `id` given to `NumberField`, so the label points at the input. */
  htmlFor?: string;
}) {
  return (
    <BaseNumberField.ScrubArea
      {...props}
      className={cn('inline-block cursor-ew-resize select-none', className)}
    >
      <label
        htmlFor={htmlFor}
        className="cursor-ew-resize text-[12.5px] font-semibold text-[var(--lq-text)]"
      >
        {children}
      </label>
      <BaseNumberField.ScrubAreaCursor className="drop-shadow-[0_1px_1px_rgba(10,15,40,0.4)]">
        <svg
          width="26"
          height="14"
          viewBox="0 0 24 14"
          fill="black"
          stroke="white"
          aria-hidden
          style={{ display: 'block' }}
        >
          <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
        </svg>
      </BaseNumberField.ScrubAreaCursor>
    </BaseNumberField.ScrubArea>
  );
}

const stepperClass =
  'flex w-9 flex-none cursor-default items-center justify-center self-stretch text-[var(--lq-text)] outline-none select-none transition-[background-color] duration-150 hover:not-data-disabled:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)] active:not-data-disabled:bg-[color-mix(in_srgb,var(--lq-highlight)_65%,transparent)] focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40';

// The hairlines between the steppers and the input. Same value the menu
// separator uses, so the group is divided by the line the popups are.
const dividerRightClass =
  'shadow-[inset_-1px_0_0_color-mix(in_srgb,var(--lq-text)_14%,transparent)]';
const dividerLeftClass =
  'shadow-[inset_1px_0_0_color-mix(in_srgb,var(--lq-text)_14%,transparent)]';

export function NumberFieldGroup({
  glass,
  className,
  children,
  ...props
}: BaseNumberField.Group.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseNumberField.Group
      {...props}
      className={cn(
        'w-45 transition-shadow duration-150',
        'has-[input:focus-visible]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_35%,transparent)]',
        'has-[input[data-invalid][data-touched]]:shadow-[0_0_0_2px_color-mix(in_srgb,var(--lq-danger)_55%,transparent)]',
        className,
      )}
      render={
        <LiquiGlass
          {...GROUP_GLASS}
          {...glass}
          contentClassName="flex h-9.5 items-stretch overflow-hidden rounded-[inherit]"
        />
      }
    >
      {children}
    </BaseNumberField.Group>
  );
}

export function NumberFieldInput({ className, ...props }: BaseNumberField.Input.Props) {
  return (
    <BaseNumberField.Input
      {...props}
      className={cn(
        'min-w-0 flex-1 border-none bg-transparent px-3 text-center font-[inherit] text-[13.5px]',
        'tabular-nums text-[var(--lq-text)] outline-none',
        'placeholder:text-[var(--lq-text-dim)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-55',
        className,
      )}
    />
  );
}

const MinusIcon = (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
    <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const PlusIcon = (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
    <path d="M2.5 6h7M6 2.5v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export function NumberFieldDecrement({
  children,
  className,
  ...props
}: BaseNumberField.Decrement.Props) {
  return (
    <BaseNumberField.Decrement
      {...props}
      // The steppers sit at the group's rounded ends, so they keep the native
      // <button>: there is no glass anatomy inside them to make it invalid.
      className={cn(stepperClass, dividerRightClass, className)}
    >
      {children ?? MinusIcon}
    </BaseNumberField.Decrement>
  );
}

export function NumberFieldIncrement({
  children,
  className,
  ...props
}: BaseNumberField.Increment.Props) {
  return (
    <BaseNumberField.Increment {...props} className={cn(stepperClass, dividerLeftClass, className)}>
      {children ?? PlusIcon}
    </BaseNumberField.Increment>
  );
}
