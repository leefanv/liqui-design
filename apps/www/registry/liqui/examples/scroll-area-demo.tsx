'use client';

import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/registry/liqui/ui/scroll-area';

/**
 * Scroll it and watch two things. The thumb is a lens with the wallpaper behind
 * it — the same decision Slider makes, for the same reason: its length is fixed
 * by the content, so a whole flick reuses one cached displacement map.
 *
 * And the text fades where it leaves the box, at whichever end still has more
 * to show. At the very top there is no fade above, because there is nothing up
 * there to suggest.
 */
const NOTES = [
  ['Displacement', 'A signed distance field gives every pixel its depth into the bezel.'],
  ['Lookup table', 'Per profile, that depth becomes how far the backdrop is displaced there.'],
  ['Snell', 'The surface slope gives the incident angle; n = 1.5 gives the bend.'],
  ['Cache', 'Maps are keyed on size and held in a 48-entry LRU, so a reopen is a lookup.'],
  ['Specular', 'A key light toward the top left, a dimmer counter-light opposite it.'],
  ['Tint', 'A gradient between two tokens, which is what lets state be a retint.'],
  ['Frost', 'Blur and tint with no filter behind them — the degradation tier.'],
  ['Bezel', 'A fraction of the box, which is why small components need small numbers.'],
];

export default function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-44 w-80">
      <ScrollAreaViewport>
        <ScrollAreaContent className="flex flex-col gap-3.5 py-2 pr-5 pl-1">
          {NOTES.map(([title, body]) => (
            <div key={title}>
              <p className="m-0 text-[12.5px] font-semibold text-[var(--lq-text)]">{title}</p>
              <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--lq-text-dim)]">{body}</p>
            </div>
          ))}
        </ScrollAreaContent>
      </ScrollAreaViewport>

      <ScrollAreaScrollbar>
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
    </ScrollArea>
  );
}
