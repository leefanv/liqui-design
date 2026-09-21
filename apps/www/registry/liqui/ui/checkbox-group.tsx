'use client';

import { CheckboxGroup as BaseCheckboxGroup } from '@base-ui/react/checkbox-group';

import { cn } from '@/lib/utils';

/**
 * liqui CheckboxGroup — shared state for a stack of
 * [checkboxes](/docs/components/checkbox), and no surface of its own.
 *
 * A checkbox group is a list, not a strip. The boxes do not share a box of
 * their own — each is a small control with text beside it and a gap under it —
 * so there is nothing here that could hold a surface, and a panel drawn around
 * them would be a card they happen to be lying on. That is a different
 * component: [Fieldset](/docs/components/fieldset), which is what usually wraps
 * this, and which is not a surface either, for its own reasons.
 *
 * [RadioGroup](/docs/components/radio-group) is the same shape and answers the
 * same way.
 *
 * The part worth reading the source for is the *parent* checkbox. Give the group
 * `allValues` and one box the `parent` prop, and Base UI puts that box into the
 * mixed state whenever some but not all of its children are ticked. In liqui
 * the mixed state carries the same accent fill as the checked one, with a dash
 * instead of a tick — "partly" is a change of mark, not a change of fill.
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
