'use client';

import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';

import { cn } from '@/lib/utils';

/**
 * liqui Fieldset — a legend and a gap, with no surface of its own.
 *
 * The obvious thing to do with a fieldset is draw a box around it, and it is
 * the wrong thing here. What goes inside a fieldset is
 * [fields](/docs/components/field), [checkboxes](/docs/components/checkbox),
 * [switches](/docs/components/switch) — every one of them already a lens. Put a
 * glass panel around them and each of those lenses is refracting the panel's
 * tint instead of the page: the backdrop they bend is UI, and the group reads
 * as one flat slab with dents in it.
 *
 * This is the same rule that flattens a
 * [toggle inside a group](/docs/components/toggle-group), keeps the
 * [dialog](/docs/components/dialog)'s dismiss a wash rather than a button, and
 * is why there is no `AvatarGroup`. Here it arrives at the strongest form of
 * the answer: the container is not a surface at all.
 *
 * So a fieldset is what it is semantically — a legend, and the controls it
 * names, on a rhythm. `<fieldset>` also comes with browser styles that fight
 * every layout it is put in, which the reset below is for.
 */

export function Fieldset({ className, ...props }: BaseFieldset.Root.Props) {
  return (
    <BaseFieldset.Root
      {...props}
      className={cn(
        // A native <fieldset> ships min-inline-size: min-content, which stops it
        // shrinking inside a flex or grid parent and is the single most common
        // reason a form blows out its container.
        'flex min-w-0 flex-col gap-3.5 border-none p-0',
        className,
      )}
    />
  );
}

/**
 * Base UI renders this as a `<div>` rather than a `<legend>` and wires the
 * association up with `aria-labelledby`, which is what lets it be laid out
 * like an ordinary block — a real `<legend>` cannot be a flex child, and its
 * position in the border is decided by the browser.
 */
export function FieldsetLegend({ className, ...props }: BaseFieldset.Legend.Props) {
  return (
    <BaseFieldset.Legend
      {...props}
      className={cn(
        'text-[13.5px] font-bold tracking-[-0.005em] text-[var(--lq-text)]',
        'data-[disabled]:text-[var(--lq-text-dim)]',
        className,
      )}
    />
  );
}
