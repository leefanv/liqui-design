'use client';

import { Separator as BaseSeparator } from '@base-ui/react/separator';

import { cn } from '@/lib/utils';

/**
 * liqui Separator — a groove cut into the surface, not a line drawn on it.
 *
 * The one component in the library with no `LiquiGlass` in it, and the reason
 * is arithmetic: a rule is one pixel across, and the lens needs a box with area
 * to bend anything. `bezel` is a *width* measured inward from the edge — on a
 * 1px element there is no inward, so the surface would render its tint and its
 * specular arc with nowhere to put them and the divider would come out as a
 * blurry smudge. Progress meets the same wall from the other side and stops at
 * a 14px track (see its Sizing note); a separator is well past it.
 *
 * So the divider is drawn the way the material would be *cut*. The kernel
 * lights a raised surface from the top-left: `--lq-rim-hi` along the top and
 * left edges, the dimmer `--lq-rim-lo` along the bottom and right. An incision
 * is that lighting inverted — the near wall falls into shadow and the far wall
 * catches the key light — which is exactly the two-line groove below: a dark
 * hairline with a bright one immediately after it, on the side facing away
 * from the light.
 *
 * That is also why this is one pixel plus a shadow rather than two pixels. The
 * element is the shadowed wall; the highlight is cast outside its box, so the
 * separator still occupies a single physical pixel of layout and a stack of
 * them stays on the same grid as everything else.
 */
export function Separator({ className, ...props }: BaseSeparator.Props) {
  return (
    <BaseSeparator
      {...props}
      className={cn(
        // The shadowed wall of the cut. `--lq-text` rather than a fixed grey:
        // the token flips with the theme, so the groove stays a groove on a
        // dark backdrop instead of turning into a bright scratch.
        'flex-none bg-[color-mix(in_srgb,var(--lq-text)_14%,transparent)]',
        'data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full',
        'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        // The lit wall, cast one pixel past the cut, away from the key light.
        'data-[orientation=horizontal]:shadow-[0_1px_0_color-mix(in_srgb,var(--lq-rim-hi)_55%,transparent)]',
        'data-[orientation=vertical]:shadow-[1px_0_0_color-mix(in_srgb,var(--lq-rim-hi)_55%,transparent)]',
        className,
      )}
    />
  );
}
