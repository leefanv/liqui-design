'use client';

import { Button } from '@/registry/liqui/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/liqui/ui/tooltip';

/**
 * Laid out as a compass so each tooltip sits clear of the others, and pinned
 * open so all four are on screen at once. `side` is a positioner prop, so it
 * passes straight through `TooltipContent` along with `align` and `sideOffset`.
 */
export default function TooltipSides() {
  return (
    <div className="grid w-full max-w-95 grid-cols-3 place-items-center gap-y-12">
      <span />
      <Anchor side="top" />
      <span />

      <Anchor side="left" />
      <span />
      <Anchor side="right" />

      <span />
      <Anchor side="bottom" />
      <span />
    </div>
  );
}

function Anchor({ side }: { side: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Tooltip open>
      <TooltipTrigger render={<Button size="sm">{side}</Button>} />
      <TooltipContent side={side}>side=&quot;{side}&quot;</TooltipContent>
    </Tooltip>
  );
}
