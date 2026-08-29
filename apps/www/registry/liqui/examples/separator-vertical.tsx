'use client';

import { LiquiGlass } from '@liqui-design/glass';

import { Separator } from '@/registry/liqui/ui/separator';

/**
 * Vertical, the highlight moves to the right of the cut — the same key light,
 * still coming from the top left, so the wall facing away from it is the one
 * that lights up.
 */
export default function SeparatorVertical() {
  return (
    <LiquiGlass
      radius={16}
      refraction={70}
      bezel={16}
      contentClassName="flex items-center gap-3.5 px-4 py-2.5 text-[13px] font-medium text-[var(--lq-text)]"
    >
      <span>Home</span>
      <span>Docs</span>
      <span>Handbook</span>
      <Separator orientation="vertical" className="h-4" />
      <span className="text-[var(--lq-text-dim)]">Log in</span>
    </LiquiGlass>
  );
}
