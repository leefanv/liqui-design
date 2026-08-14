'use client';

import { Toggle } from '@/registry/liqui/ui/toggle';
import { ToggleGroup } from '@/registry/liqui/ui/toggle-group';

/**
 * One lens for the whole strip. The toggles inside are flat by default — they
 * sit on the group's own tint, not on the page, so a lens there would have
 * nothing to bend but the surface it is lying on.
 */
export default function ToggleGroupDemo() {
  return (
    <ToggleGroup aria-label="Text alignment" defaultValue={['left']}>
      <Toggle value="left" aria-label="Align left">
        <AlignIcon d="M2.5 4.5h11m-11 7h9M2.5 8h5" />
      </Toggle>
      <Toggle value="center" aria-label="Align center">
        <AlignIcon d="M2.5 4.5h11m-10 7h9M5.5 8h5" />
      </Toggle>
      <Toggle value="right" aria-label="Align right">
        <AlignIcon d="M2.5 4.5h11m-9 7h9M8.5 8h5" />
      </Toggle>
    </ToggleGroup>
  );
}

function AlignIcon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      aria-hidden
      className="block"
    >
      <path strokeLinecap="round" d={d} />
    </svg>
  );
}
