'use client';

import * as React from 'react';

import { Toggle } from '@/registry/liqui/ui/toggle';
import { ToggleGroup } from '@/registry/liqui/ui/toggle-group';

/**
 * `multiple` is the case that settles where the glass goes. With two toggles
 * lit at once there is no single travelling surface to make the lens, the way
 * Tabs makes its indicator one — so the strip refracts and the pressed toggles
 * are washes on it.
 */
export default function ToggleGroupMultiple() {
  const [style, setStyle] = React.useState(['bold']);

  return (
    <div className="flex flex-col items-start gap-3">
      <ToggleGroup multiple aria-label="Text style" value={style} onValueChange={setStyle}>
        <Toggle value="bold" aria-label="Bold" className="w-9 font-bold">
          B
        </Toggle>
        <Toggle value="italic" aria-label="Italic" className="w-9 font-serif italic">
          I
        </Toggle>
        <Toggle value="underline" aria-label="Underline" className="w-9 underline">
          U
        </Toggle>
      </ToggleGroup>
      <p className="text-[12.5px] text-[var(--lq-text-dim)]">
        {style.length > 0 ? style.join(' · ') : 'none'}
      </p>
    </div>
  );
}
