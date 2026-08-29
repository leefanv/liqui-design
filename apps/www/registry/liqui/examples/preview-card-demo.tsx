'use client';

import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardDescription,
  PreviewCardTitle,
  PreviewCardTrigger,
} from '@/registry/liqui/ui/preview-card';

/**
 * Rest on the link and wait. The card lands *on the paragraph* — which is why
 * its frost is nearly twice the popover's: a surface that arrives uninvited must
 * not smear the sentence you were in the middle of.
 *
 * Look at the bezel rather than the middle. The edge still bends the words
 * running under it; only the body is opaque enough to read on.
 */
export default function PreviewCardDemo() {
  return (
    <PreviewCard>
      <p className="m-0 max-w-sm text-[14px] leading-[1.7] text-balance text-[var(--lq-text)]">
        A surface is only as convincing as what it is standing on, which is why
        every preview in these docs sits on a{' '}
        <PreviewCardTrigger href="#">displacement map</PreviewCardTrigger> rather
        than a flat fill. Rest on that link and read the four lines under it while
        the card is open: the bezel is still bending them, and the body of the
        card is still opaque enough that the sentence you were in the middle of
        is the one thing you have not lost.
      </p>

      <PreviewCardContent>
        <PreviewCardTitle>Displacement map</PreviewCardTitle>
        <PreviewCardDescription>
          A per-pixel image of how far the backdrop moves under the bezel. Red
          encodes horizontal shift, blue vertical, and 128 is neutral — so a flat
          grey map is a surface that bends nothing.
        </PreviewCardDescription>
      </PreviewCardContent>
    </PreviewCard>
  );
}
