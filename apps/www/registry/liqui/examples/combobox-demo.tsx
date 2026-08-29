'use client';

import * as React from 'react';

import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/registry/liqui/ui/combobox';

/**
 * Type a letter and watch the popup. It changes height on almost every
 * keystroke and none of those changes are animated — each one is a
 * displacement map, and a small set of repeating heights is a set the cache can
 * hold. A 350ms resize would build a new map per frame instead.
 */
const PROFILES = ['Squircle', 'Convex', 'Rim', 'Frost', 'Clear', 'Elevated', 'Dispersed'];

export default function ComboboxDemo() {
  // A native label, not `Combobox.Label` — that part labels the trigger, and
  // the form control here is the input.
  const id = React.useId();

  return (
    <Combobox items={PROFILES}>
      <div className="flex w-64 flex-col gap-1.5">
        <label htmlFor={id} className="text-[12.5px] font-semibold text-[var(--lq-text)]">
          Surface profile
        </label>
        <ComboboxInputGroup>
          <ComboboxInput id={id} placeholder="e.g. Squircle" />
          <ComboboxClear />
          <ComboboxTrigger />
        </ComboboxInputGroup>
      </div>

      <ComboboxContent>
        <ComboboxEmpty>No profile by that name.</ComboboxEmpty>
        <ComboboxList>
          {(profile: string) => (
            <ComboboxItem key={profile} value={profile}>
              {profile}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
