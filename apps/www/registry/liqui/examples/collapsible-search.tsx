'use client';

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@/registry/liqui/ui/collapsible';

/**
 * `hiddenUntilFound` hides the panel with `hidden="until-found"` instead of
 * unmounting it, so the browser's own in-page search can find the text inside a
 * closed section and open it. Press ⌘F and search for "Snell" — the section
 * expands on its own.
 *
 * The panel stays in the DOM the whole time, which for glass means the frost
 * layer is mounted while closed too. That is free: frost is a `backdrop-filter`
 * on a zero-height box, with no canvas map and no SVG filter behind it.
 */
export default function CollapsibleSearch() {
  return (
    <Collapsible className="w-80">
      <CollapsibleTrigger>Refraction</CollapsibleTrigger>
      <CollapsiblePanel hiddenUntilFound>
        <p>
          The surface slope gives the incident angle, Snell&rsquo;s law at n = 1.5
          the bend, and the remaining glass depth the lateral shift.
        </p>
      </CollapsiblePanel>
    </Collapsible>
  );
}
