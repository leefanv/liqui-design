'use client';

import * as React from 'react';

import { Checkbox, CheckboxLabel } from '@/registry/liqui/ui/checkbox';
import { CheckboxGroup } from '@/registry/liqui/ui/checkbox-group';

/**
 * Tick one child and watch the parent. It goes to the mixed state, which wears
 * the *same* accent retint as a fully checked box and swaps the tick for a
 * dash: "some of these" is a different mark on the same material, not a
 * weaker version of the material.
 *
 * The mark comes from the indicator's state rather than an `indeterminate`
 * prop, because nothing is passed down here — the group is what puts the parent
 * in that state.
 */
const SCOPES = ['read', 'write', 'delete'];

export default function CheckboxGroupParent() {
  const [value, setValue] = React.useState<string[]>(['read']);

  return (
    <CheckboxGroup
      className="w-64"
      allValues={SCOPES}
      value={value}
      onValueChange={setValue}
      aria-label="Repository access"
    >
      <CheckboxLabel>
        <Checkbox parent />
        Repository access
      </CheckboxLabel>

      <div className="ml-7 flex flex-col gap-2.5">
        <CheckboxLabel>
          <Checkbox value="read" />
          Read
        </CheckboxLabel>
        <CheckboxLabel>
          <Checkbox value="write" />
          Write
        </CheckboxLabel>
        <CheckboxLabel>
          <Checkbox value="delete" />
          Delete
        </CheckboxLabel>
      </div>
    </CheckboxGroup>
  );
}
