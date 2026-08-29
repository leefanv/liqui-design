'use client';

import * as React from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/registry/liqui/ui/combobox';

/**
 * The chips are flat, and they have to be: a chip with its own bezel would be a
 * lens inside the field's lens, refracting the field rather than the page. Same
 * rule that flattens a toggle inside a toggle group.
 *
 * The field grows a row at a time as chips wrap, which is another discrete
 * resize — a handful of heights, all of them repeated.
 */
const LAYERS = ['Backdrop', 'Refraction', 'Tint', 'Specular', 'Shine', 'Content'];

export default function ComboboxMultiple() {
  const [value, setValue] = React.useState<string[]>(['Tint', 'Specular']);
  const id = React.useId();

  return (
    <Combobox items={LAYERS} multiple value={value} onValueChange={setValue}>
      <div className="flex w-72 flex-col gap-1.5">
        <label htmlFor={id} className="text-[12.5px] font-semibold text-[var(--lq-text)]">
          Layers to inspect
        </label>
        <ComboboxInputGroup>
          <ComboboxChips>
            {value.map((layer) => (
              <ComboboxChip key={layer} aria-label={layer}>
                {layer}
                <ComboboxChipRemove />
              </ComboboxChip>
            ))}
          </ComboboxChips>
          <ComboboxInput id={id} placeholder={value.length ? '' : 'Add a layer'} />
          <ComboboxTrigger />
        </ComboboxInputGroup>
      </div>

      <ComboboxContent>
        <ComboboxEmpty>Nothing left to add.</ComboboxEmpty>
        <ComboboxList>
          {(layer: string) => (
            <ComboboxItem key={layer} value={layer}>
              {layer}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
