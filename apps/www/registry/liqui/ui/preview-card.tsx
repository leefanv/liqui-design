'use client';

import * as React from 'react';
import { PreviewCard as BasePreviewCard } from '@base-ui/react/preview-card';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui PreviewCard — [Popover](/docs/components/popover)'s surface with the
 * frost turned up, because this one lands on a sentence.
 *
 * Every other popup in the library opens because you asked for it, and opens
 * over layout: a menu over a page, a dialog over a scrim, a tooltip over a
 * button. A preview card opens because your pointer drifted onto a link, and it
 * lands on the paragraph you were reading. A lens at popover transparency then
 * bends the words underneath it, and the reader gets a smeared sentence they
 * did not ask to lose.
 *
 * So `frost` goes from the popup default of 0.35 to 0.6. The card still
 * refracts — the bezel still bends the edges of whatever is behind it — but the
 * middle is opaque enough to read on.
 *
 * Which means the tail's numbers are not Popover's. `LiquiGlass` derives its
 * backdrop blur from `blur + frost × 14` and its tint opacity from
 * `0.25 + 0.75 × frost`, and the tail is a `clip-path` wearing those values by
 * hand — it does not follow the surface. The two constants below are those
 * formulas evaluated at *this* component's frost, and they are the thing to
 * check if you change it.
 */

export const PreviewCard = BasePreviewCard.Root;
export const PreviewCardViewport = BasePreviewCard.Viewport;
export const createPreviewCardHandle = BasePreviewCard.createHandle;

const POPUP_GLASS = {
  elevated: true,
  radius: 18,
  blur: 1,
  refraction: 120,
  bezel: 24,
  frost: 0.6,
} satisfies Partial<LiquiGlassProps>;

/** Tail size. The cross-axis offset below is derived from it: (w + h) / 2. */
const ARROW_W = 20;
const ARROW_H = 10;

/**
 * Pointing up; the side variants rotate it into place. Left open at the base on
 * purpose — closing it would stroke the rim across the join, where the tail
 * meets the popup and there is no edge to catch light.
 */
const ARROW_OUTLINE = 'M0.5 10 L7.4 2.7 C8.8 1.2 11.2 1.2 12.6 2.7 L19.5 10';

/** `blur + frost × 14` at `blur: 1, frost: 0.6`. */
const ARROW_BACKDROP = 'blur(9.4px) saturate(1.7)';
/**
 * The middle of the popup's tint ramp at `0.25 + 0.75 × frost`. Flat rather
 * than a gradient: a 135° ramp restarted across 20px runs backwards once the
 * side variants rotate it, and a tail always meets the middle of an edge, where
 * one mid value matches better than any gradient does.
 */
const ARROW_TINT =
  'color-mix(in srgb, color-mix(in srgb, var(--lq-tint), var(--lq-tint-deep)) 70%, transparent)';

export function PreviewCardTrigger({ className, ...props }: BasePreviewCard.Trigger.Props) {
  return (
    <BasePreviewCard.Trigger
      {...props}
      className={cn(
        'cursor-default rounded-sm font-medium text-[var(--lq-text)] underline decoration-[color-mix(in_srgb,var(--lq-text)_45%,transparent)] decoration-1 underline-offset-2 outline-none',
        'hover:decoration-[var(--lq-text)] data-[popup-open]:decoration-[var(--lq-text)]',
        'focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--lq-accent)_35%,transparent)]',
        className,
      )}
    />
  );
}

export function PreviewCardArrow({ className, ...props }: BasePreviewCard.Arrow.Props) {
  return (
    <BasePreviewCard.Arrow
      {...props}
      className={cn(
        'h-[10px] w-[20px] leading-[0]',
        // The kernel lights the top and left edges with `--lq-rim-hi` and leaves
        // the bottom and right on the dim `--lq-rim-lo`. A tail extends one of
        // those edges, so it has to be lit like the edge it extends — a bright
        // outline hanging off a dim edge is the seam you actually see.
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
    </BasePreviewCard.Arrow>
  );
}

export function PreviewCardContent({
  children,
  glass,
  className,
  arrow = true,
  /** Clears the tail. Drop it to 6 alongside `arrow={false}`. */
  sideOffset = ARROW_H,
  ...positionerProps
}: BasePreviewCard.Positioner.Props & {
  glass?: Partial<LiquiGlassProps>;
  /** Renders the tail pointing back at the trigger. */
  arrow?: boolean;
}) {
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner
        sideOffset={sideOffset}
        collisionPadding={12}
        {...positionerProps}
        className="z-100 outline-none"
      >
        <BasePreviewCard.Popup
          className={cn(
            'w-72 max-w-[var(--available-width)] [transform-origin:var(--transform-origin)]',
            'transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.2,1.1,0.3,1)] focus:outline-none',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          render={<LiquiGlass {...POPUP_GLASS} {...glass} />}
        >
          {arrow ? <PreviewCardArrow /> : null}
          <div className="p-4">{children}</div>
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}

export function PreviewCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={cn(
        'm-0 text-[13.5px] font-bold tracking-[-0.005em] text-[var(--lq-text)]',
        className,
      )}
    />
  );
}

export function PreviewCardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={cn('m-0 mt-1.5 text-[13px] leading-[1.55] text-[var(--lq-text-dim)]', className)}
    />
  );
}
