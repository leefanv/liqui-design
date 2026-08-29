'use client';

import { LiquiGlass } from '@liqui-design/glass';

import { Separator } from '@/registry/liqui/ui/separator';

/**
 * The groove only reads on a surface, so the demo brings one. Look along the
 * rule at a shallow angle: the dark hairline is the near wall of the cut and
 * the bright one under it is the far wall catching the same key light the
 * panel's own rim is lit by.
 */
export default function SeparatorDemo() {
  return (
    <LiquiGlass
      radius={18}
      refraction={120}
      bezel={24}
      contentClassName="flex w-72 flex-col p-1.5"
    >
      {['Duplicate', 'Rename', 'Move to…'].map((label, index) => (
        <div key={label}>
          {index > 0 ? <Separator className="mx-2.5 my-[5px]" /> : null}
          <div className="rounded-xl px-3 py-[7px] text-[13.5px] font-[450] text-[var(--lq-text)]">
            {label}
          </div>
        </div>
      ))}
    </LiquiGlass>
  );
}
