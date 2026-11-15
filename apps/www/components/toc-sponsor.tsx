'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { trackSponsorClick, trackSponsorImpression } from '@/lib/analytics';
import { MOBBIN, type SponsorCreative } from '@/lib/partners';
import { cn } from '@/lib/utils';

/**
 * The sponsored card under "On this page".
 *
 * Below the table of contents because that column is otherwise empty once the
 * headings run out, and it is the one place on a docs page nobody is reading
 * past to get to the content. It shows only where the table of contents does
 * — on a wide screen, and not while the theme panel has taken the column.
 *
 * - **Disclosed, every time.** "Sponsored" sits beside the card, and the link
 *   is `rel="sponsored"` (keeping the referrer, so Mobbin sees the visit;
 *   `noopener` still drops the opener).
 * - **The partner's own artwork, in the page's appearance.** Both loops are
 *   in the markup; CSS shows the one for light or dark, and a hidden video is
 *   never on screen, so it never plays and never downloads.
 * - **Nothing loads until it is seen.** `preload="none"`, and the visible loop
 *   plays only while on screen. With reduced motion the poster stands in.
 */
export function TocSponsor() {
  const pathname = usePathname();
  const ref = React.useRef<HTMLAnchorElement>(null);

  const event = React.useCallback(
    () => ({
      program: MOBBIN.name,
      placement: 'docs_toc',
      creative: document.documentElement.classList.contains('dark')
        ? MOBBIN.creatives.dark.id
        : MOBBIN.creatives.light.id,
      docPage: pathname,
    }),
    [pathname],
  );

  // One impression per page: the first time at least half the card is on
  // screen. Re-armed when the path changes, since the column survives a
  // navigation between two docs pages.
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackSponsorImpression(event());
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [event]);

  return (
    <div className="mt-6 pt-6 border-t border-fd-border">
      <a
        ref={ref}
        href={MOBBIN.url}
        target="_blank"
        rel="sponsored noopener"
        title={`Sponsored link — we may earn a commission if you subscribe to ${MOBBIN.name}.`}
        onClick={() => trackSponsorClick(event(), MOBBIN.estimatedValuePerClick)}
        data-sponsor={MOBBIN.name.toLowerCase()}
        className="group block"
      >
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-fd-border transition-opacity group-hover:opacity-90">
          <Loop creative={MOBBIN.creatives.light} className="dark:hidden" />
          <Loop creative={MOBBIN.creatives.dark} className="hidden dark:block" />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-0.5 text-xs">
          <span className="truncate text-fd-muted-foreground transition-colors group-hover:text-fd-foreground">
            {MOBBIN.tagline}
          </span>
          <span className="shrink-0 text-fd-muted-foreground/70">Sponsored</span>
        </div>
      </a>
    </div>
  );
}

function Loop({ creative, className }: { creative: SponsorCreative; className?: string }) {
  const ref = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // play() is what starts the download; a rejection here only means
          // the element went away mid-play.
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        }
      },
      { threshold: 0.01 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={creative.video}
      poster={creative.poster}
      aria-label={creative.alt}
      loop
      muted
      playsInline
      preload="none"
      className={cn('block size-full object-cover', className)}
    />
  );
}
