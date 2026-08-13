'use client';

import { Popover as BasePopover } from '@base-ui/react/popover';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Popover — a glass panel anchored to a trigger, with a tail.
 *
 * The tail is the interesting part. `Popover.Arrow` renders inside the popup but
 * positions itself *outside* its box, so the page — not the panel — is what sits
 * behind it, and it can carry the same blurred, tinted material the popup does.
 * What it cannot carry is the lens: `LiquiGlass` is a rounded rect, and a 20×10
 * triangle has no room for a bezel to refract through. So the tail is a
 * `clip-path` wearing the popup's blur and tint tokens, with the rim stroked
 * along its two outer edges. Same material, minus the displacement.
 *
 * A control *inside* the popup has the opposite problem — see the `clear`
 * material note on the component page.
 *
 * Like Select and unlike ContextMenu, the portal cannot be kept mounted —
 * `Popover.Portal` returns `null` while closed. Reopening is still cheap: the
 * displacement map is cached by size and the filter registry outlives the
 * popup, so only the first open pays for generation.
 */

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;
export const PopoverClose = BasePopover.Close;

const POPUP_GLASS = {
  elevated: true,
  radius: 18,
  blur: 1,
  refraction: 120,
  bezel: 24,
} satisfies Partial<LiquiGlassProps>;

/** Tail size. The cross-axis offset below is derived from it: (w + h) / 2. */
const ARROW_W = 20;
const ARROW_H = 10;

/**
 * Pointing up; the side variants rotate it into place. The outline is left open
 * on purpose — closing it would stroke the rim across the base, where the tail
 * meets the popup and there is no edge to catch light.
 */
const ARROW_OUTLINE = 'M0.5 10 L7.4 2.7 C8.8 1.2 11.2 1.2 12.6 2.7 L19.5 10';

/**
 * The popup's material, hard-coded. The kernel derives its own from
 * `blur + frost × 14` and its tint layer from `0.25 + 0.75 × frost`; these are
 * those formulas at the defaults this component ships (`blur: 1, frost: 0.35`).
 * Move `frost` a long way through the `glass` prop and the tail is the thing to
 * check — it does not follow.
 *
 * The fill is flat, and it is the *middle* of the popup's tint ramp. The tint is
 * a 135° gradient; a gradient of its own would restart that ramp across 20px
 * and, once the side variants rotate it, run it backwards — bright end at the
 * tip, dark end against a popup edge that is already dark. A tail always meets
 * the middle of an edge, where a 135° ramp is near its midpoint, so one flat mid
 * value matches every side better than any gradient does.
 */
const ARROW_BACKDROP = 'blur(6px) saturate(1.7)';
const ARROW_TINT =
  'color-mix(in srgb, color-mix(in srgb, var(--lq-tint), var(--lq-tint-deep)) 52%, transparent)';

export function PopoverArrow({ className, ...props }: BasePopover.Arrow.Props) {
  return (
    <BasePopover.Arrow
      {...props}
      className={cn(
        // Floating UI supplies the along-the-edge coordinate as an inline style
        // (`left` for top/bottom sides, `top` for left/right); the cross-axis
        // offset and the rotation are ours. Sliding the box half its own width
        // plus half its height past the edge lands the base exactly on it once
        // rotated — the same arithmetic Base UI's own example uses.
        'h-[10px] w-[20px] leading-[0]',
        // `--lq-tail-rim` mirrors the kernel's own shine, which lights the top
        // and left edges with `--lq-rim-hi` and leaves the bottom and right on
        // the dim `--lq-rim-lo`. A tail extends one of those edges, so it has to
        // be lit like that edge — a bright outline hanging off a dim edge is the
        // seam you actually see.
        'data-[side=bottom]:top-[-10px] data-[side=bottom]:[--lq-tail-rim:var(--lq-rim-hi)]',
        'data-[side=top]:bottom-[-10px] data-[side=top]:rotate-180 data-[side=top]:[--lq-tail-rim:var(--lq-rim-lo)]',
        'data-[side=left]:right-[-15px] data-[side=left]:rotate-90 data-[side=left]:[--lq-tail-rim:var(--lq-rim-lo)]',
        'data-[side=right]:left-[-15px] data-[side=right]:-rotate-90 data-[side=right]:[--lq-tail-rim:color-mix(in_srgb,var(--lq-rim-hi)_60%,transparent)]',
        className,
      )}
    >
      <span
        className="absolute inset-0 block"
        style={{
          clipPath: `path('${ARROW_OUTLINE} Z')`,
          backdropFilter: ARROW_BACKDROP,
          WebkitBackdropFilter: ARROW_BACKDROP,
          backgroundColor: ARROW_TINT,
        }}
      />
      <svg
        width={ARROW_W}
        height={ARROW_H}
        viewBox="0 0 20 10"
        fill="none"
        aria-hidden
        className="absolute inset-0"
      >
        <path d={ARROW_OUTLINE} stroke="var(--lq-tail-rim)" strokeWidth="1" />
      </svg>
    </BasePopover.Arrow>
  );
}

export function PopoverContent({
  children,
  glass,
  className,
  arrow = true,
  // Clears the tail. Drop it to 6 alongside `arrow={false}`.
  sideOffset = ARROW_H,
  ...positionerProps
}: BasePopover.Positioner.Props & {
  glass?: Partial<LiquiGlassProps>;
  /** Renders the tail pointing back at the trigger. */
  arrow?: boolean;
}) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        sideOffset={sideOffset}
        collisionPadding={12}
        {...positionerProps}
        className="z-100 outline-none"
      >
        <BasePopover.Popup
          className={cn(
            'w-72 max-w-[var(--available-width)] [transform-origin:var(--transform-origin)]',
            'transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.2,1.1,0.3,1)] focus:outline-none',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          render={<LiquiGlass {...POPUP_GLASS} {...glass} />}
        >
          {arrow ? <PopoverArrow /> : null}
          <div className="p-4">{children}</div>
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export function PopoverTitle({ className, ...props }: BasePopover.Title.Props) {
  return (
    <BasePopover.Title
      {...props}
      className={cn(
        'text-[13.5px] font-bold tracking-[-0.005em] text-[var(--lq-text)]',
        className,
      )}
    />
  );
}

export function PopoverDescription({ className, ...props }: BasePopover.Description.Props) {
  return (
    <BasePopover.Description
      {...props}
      className={cn('mt-1.5 text-[13px] leading-[1.55] text-[var(--lq-text-dim)]', className)}
    />
  );
}
