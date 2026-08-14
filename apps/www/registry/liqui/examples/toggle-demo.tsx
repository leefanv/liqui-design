'use client';

import * as React from 'react';

import { Toggle } from '@/registry/liqui/ui/toggle';

/**
 * Outside a group, each toggle is its own surface — three separate lenses, each
 * filling with accent when it latches on.
 */
export default function ToggleDemo() {
  const [focus, setFocus] = React.useState(true);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Toggle pressed={focus} onPressedChange={setFocus}>
        Focus
      </Toggle>
      <Toggle>Stage Manager</Toggle>
      <Toggle defaultPressed disabled>
        Managed
      </Toggle>
    </div>
  );
}
