/**
 * Sponsored placements on the docs. One partner, one slot, for now.
 *
 * Mobbin's affiliate program (Rewardful), shared with the liquid-notion-home
 * gallery — terms and the reasoning behind the numbers are written up in that
 * project's `src/lib/affiliates.ts`. The parts that bind here:
 *  - `?via=` works on any mobbin.com URL; ours is `liqui-design`.
 *  - Organic placement only — no paid ads may point at Mobbin or the link.
 *  - The artwork is Mobbin's own, from the affiliate media kit ("Banners —
 *    Static & Animated"), published for exactly this; it is not ours to crop
 *    or retouch, and the copy below is the kit's wording, not ours.
 */

export type SponsorPlacement = 'docs_toc';

export interface SponsorCreative {
  /** Short stable id, sent to GA as `creative`. */
  id: string;
  video: string;
  poster: string;
  /** Describes the artwork for screen readers; the loops are silent. */
  alt: string;
}

export const MOBBIN = {
  name: 'Mobbin',
  url: 'https://mobbin.com/?via=liqui-design',
  /**
   * Estimated earnings per click in USD, sent as the GA `value` so the event
   * value reads as estimated revenue. The liquid-notion-home starting estimate
   * ($48 per paid referral × an assumed 0.5–1% click → paid rate); replace it
   * with (commission in Rewardful ÷ affiliate_click in GA) once there is data.
   */
  estimatedValuePerClick: 0.35,
  /** Kit › About us › "What is Mobbin?", the noun phrase. */
  tagline: 'Real-world design inspiration',
  /** One per page appearance; the kit ships the loop in both. */
  creatives: {
    light: {
      id: 'loop-light',
      video: '/partners/mobbin/loop-light.mp4',
      poster: '/partners/mobbin/loop-light.webp',
      alt: 'Mobbin: Never run out of design inspiration again — icons of real apps scrolling past',
    },
    dark: {
      id: 'loop-dark',
      video: '/partners/mobbin/loop-dark.mp4',
      poster: '/partners/mobbin/loop-dark.webp',
      alt: "Mobbin: You don't need to reinvent the wheel — icons of real apps scrolling past",
    },
  } satisfies Record<'light' | 'dark', SponsorCreative>,
} as const;
