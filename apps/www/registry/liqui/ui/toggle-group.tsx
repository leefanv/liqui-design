'use client';

import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';
import { ToggleOwnsSurface } from '@/registry/liqui/ui/toggle';

/**
 * liqui ToggleGroup — the strip is the lens, the toggles are washes on it.
 *
 * This is Tabs reaching the opposite conclusion from the same rule,
 * and the reason is what the two controls can express. A tab strip has exactly
 * one selection, so it has one thing that moves, and the lens goes on the mover.
 * A toggle group with `multiple` has none — two buttons can be lit at once, and
 * there is no single travelling surface to be. So the strip itself refracts,
 * once, for the whole control, and pressing a toggle lays accent over glass
 * that is already there. The dialog's dismiss button is flat for the same
 * reason: a second lens inside a surface has nothing to bend but the first.
 *
 * The flattening is not a prop the caller passes — `Toggle` reads it from
 * context, so a toggle behaves correctly by being in the right place.
 */

const GROUP_GLASS = {
  radius: 14,
  blur: 1,
  refraction: 60,
  bezel: 13,
} satisfies Partial<LiquiGlassProps>;

export interface ToggleGroupProps extends BaseToggleGroup.Props {
  /** Overrides for the underlying glass strip (radius, refraction, bezel…). */
  glass?: Partial<LiquiGlassProps>;
}

export function ToggleGroup({ glass, className, children, ...props }: ToggleGroupProps) {
  return (
    <ToggleOwnsSurface.Provider value={false}>
      <BaseToggleGroup
        {...props}
        className={cn('group inline-flex', className)}
        render={
          <LiquiGlass
            {...GROUP_GLASS}
            {...glass}
            // `data-orientation` lands on the root, not on the wrapper the
            // toggles actually sit in, so the wrapper reads it off the group.
            contentClassName="flex gap-0.5 rounded-[inherit] p-[3px] group-data-[orientation=vertical]:flex-col"
          />
        }
      >
        {children}
      </BaseToggleGroup>
    </ToggleOwnsSurface.Provider>
  );
}
