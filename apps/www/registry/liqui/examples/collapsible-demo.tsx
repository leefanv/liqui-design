'use client';

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@/registry/liqui/ui/collapsible';

/**
 * Open and close it a few times and watch the two surfaces separately. The
 * trigger's rim bends the backdrop and never changes size, so its map is built
 * once. The panel is the same material at the frost tier — no displacement, so
 * growing costs nothing.
 */
export default function CollapsibleDemo() {
  return (
    <Collapsible className="w-80" defaultOpen>
      <CollapsibleTrigger>Displacement map</CollapsibleTrigger>
      <CollapsiblePanel>
        <p>
          A signed distance field gives every pixel its depth into the bezel, and a
          per-profile lookup table turns that depth into how far the backdrop is
          displaced there.
        </p>
        <p>
          Maps are cached module-wide and keyed on size, which is why a popup that
          reopens at the same width costs a lookup rather than a canvas render.
        </p>
      </CollapsiblePanel>
    </Collapsible>
  );
}
