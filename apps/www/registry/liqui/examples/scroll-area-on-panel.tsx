'use client';

import { LiquiGlass } from '@liqui-design/glass';

import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/registry/liqui/ui/scroll-area';

/**
 * The one case the component cannot get right on its own: inside a panel, a
 * refracting thumb bends the panel rather than the page, so the two right-hand
 * thumbs here are dropped to `clear` — tint and rim, no lens.
 *
 * Scroll both at once and the difference is the point. On the left the thumb
 * still carries a lens it has nothing to use; on the right it has stopped
 * pretending.
 */
const ROWS = Array.from({ length: 14 }, (_, i) => `Layer ${String(i + 1).padStart(2, '0')}`);

function List({ clear }: { clear?: boolean }) {
  return (
    <ScrollArea className="h-40 w-40">
      <ScrollAreaViewport>
        <ScrollAreaContent className="flex flex-col gap-1 py-1.5 pr-4 pl-1">
          {ROWS.map((row) => (
            <p key={row} className="m-0 text-[12.5px] text-[var(--lq-text)]">
              {row}
            </p>
          ))}
        </ScrollAreaContent>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar>
        <ScrollAreaThumb glass={clear ? { material: 'clear' } : undefined} />
      </ScrollAreaScrollbar>
    </ScrollArea>
  );
}

export default function ScrollAreaOnPanel() {
  return (
    <LiquiGlass
      radius={20}
      refraction={130}
      bezel={26}
      contentClassName="flex gap-4 p-4"
      elevated
    >
      <List />
      <List clear />
    </LiquiGlass>
  );
}
