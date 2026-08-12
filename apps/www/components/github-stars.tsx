import { Suspense } from 'react';

import { fetchStarCount, formatStarCount } from '@/lib/github';

/**
 * The GitHub mark with the live star count beside it, shaped to sit inside
 * Fumadocs' icon link item — see `layout.shared.tsx`. That slot is what puts it
 * top-right on the home page and bottom-left in the docs sidebar, styled and
 * spaced like the theme switch it sits next to, so this renders no chrome of
 * its own and lets the surrounding button styles size the mark.
 *
 * The count is fetched by a nested async component behind Suspense, so a slow
 * or unreachable GitHub API delays the number and not the page around it.
 */
export function GitHubStars() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <GitHubMark className="shrink-0" />
      {/* The link carries no `aria-label`, so these two make its accessible
          name "liqui on GitHub, 20 stars" instead of a bare "20". */}
      <span className="sr-only">liqui on GitHub</span>
      <Suspense fallback={<StarCountPlaceholder />}>
        <StarCount />
      </Suspense>
    </span>
  );
}

/**
 * A null count means GitHub did not answer — see `fetchStarCount`. The link is
 * still worth showing, so the number is the only thing that goes missing.
 */
async function StarCount() {
  const count = await fetchStarCount();
  if (count === null) return null;

  return (
    <span className="text-sm font-medium tabular-nums">
      {formatStarCount(count)}
      <span className="sr-only"> stars</span>
    </span>
  );
}

/**
 * Holds the number's width while the count resolves, so the nav does not jump
 * sideways on the rare render that is not served from the cache.
 */
function StarCountPlaceholder() {
  return <span className="h-3.5 w-6 animate-pulse rounded bg-fd-muted" />;
}

/**
 * The GitHub mark, matching the one Fumadocs draws for its own `githubUrl`
 * item — this badge replaces that icon and should not look like a different
 * site's logo.
 */
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
