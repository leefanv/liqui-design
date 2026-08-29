'use client';

import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardDescription,
  PreviewCardTitle,
  PreviewCardTrigger,
} from '@/registry/liqui/ui/preview-card';

/**
 * The same card at two delays. The first opens almost at once, the second takes
 * Base UI's default 600ms.
 *
 * There is a glass reason to prefer the slower one. The popup's displacement map
 * is generated the first time it opens at a given size, and a card that fires on
 * every link the pointer crosses is asking for that work while the reader is
 * still moving — a delay is not only manners, it is when the surface has time to
 * be built.
 */
export default function PreviewCardDelay() {
  return (
    <div className="flex max-w-sm flex-col gap-3 text-[14px] leading-[1.7] text-[var(--lq-text)]">
      <PreviewCard>
        <PreviewCardTrigger href="#" delay={100} className="self-start">
          Opens at 100ms
        </PreviewCardTrigger>
        <PreviewCardContent>
          <PreviewCardTitle>Eager</PreviewCardTitle>
          <PreviewCardDescription>
            Fires while the pointer is still travelling, and fires again on the
            next link it crosses.
          </PreviewCardDescription>
        </PreviewCardContent>
      </PreviewCard>

      <PreviewCard>
        <PreviewCardTrigger href="#" className="self-start">
          Opens at 600ms
        </PreviewCardTrigger>
        <PreviewCardContent>
          <PreviewCardTitle>Default</PreviewCardTitle>
          <PreviewCardDescription>
            Long enough to mean you stopped, and long enough for the first map to
            be generated before anyone is looking at it.
          </PreviewCardDescription>
        </PreviewCardContent>
      </PreviewCard>
    </div>
  );
}
