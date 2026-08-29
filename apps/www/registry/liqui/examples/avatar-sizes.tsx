'use client';

import { Avatar, AvatarFallback } from '@/registry/liqui/ui/avatar';

/**
 * `size` is a number, not a class, because the ring around the picture *is* the
 * bezel — it has to shrink with the disc, and the radius has to stay exactly
 * half the box for the map's corners to keep matching the circle.
 *
 * Watch the rim rather than the initials: the same ratio at five diameters, so
 * the smallest disc reads as the same material as the largest instead of as a
 * dot with a thick border.
 */
const SIZES = [24, 32, 40, 56, 72];

export default function AvatarSizes() {
  return (
    <div className="flex items-end gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Avatar size={size}>
            <AvatarFallback>LQ</AvatarFallback>
          </Avatar>
          <span className="text-[11px] tabular-nums text-[var(--lq-text-dim)]">{size}</span>
        </div>
      ))}
    </div>
  );
}
