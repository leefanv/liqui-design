'use client';

import { CheckboxGroup as BaseCheckboxGroup } from '@base-ui/react/checkbox-group';

import { cn } from '@/lib/utils';

/**
 * liqui CheckboxGroup — shared state for a stack of
 * [checkboxes](/docs/components/checkbox), and no surface of its own.
 *
 * Every box in the group is already a lens. A glass panel around them would be
 * the backdrop each of those lenses bends, so the group would refract itself
 * and read as one slab with dents in it — the argument written out on
 * [Fieldset](/docs/components/fieldset), which is what usually wraps this.
 *
 * The part that is specific to glass is the *parent* checkbox. Give the group
 * `allValues` and one box the `parent` prop, and Base UI puts that box into the
 * mixed state whenever some but not all of its children are ticked. In liqui
 * the mixed state carries the same accent retint as the checked one, with a
 * dash instead of a tick — see the component page for why "partly" is a change
 * of mark rather than a change of material.
 *
 * That only works because `Checkbox` picks its mark from the indicator's state
 * rather than from an `indeterminate` prop: nothing is passed down to a parent
 * box, the group sets it.
 */
export function CheckboxGroup({ className, ...props }: BaseCheckboxGroup.Props) {
  return (
    <BaseCheckboxGroup {...props} className={cn('flex flex-col gap-2.5', className)} />
  );
}
