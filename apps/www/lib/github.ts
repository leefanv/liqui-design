import { gitConfig } from './shared';

/**
 * How long a star count stays good for. The number moves slowly and nobody
 * refreshes the docs to watch it tick, so an hour buys a fresh figure while
 * keeping the site to 24 GitHub calls a day — well inside the 60/hour the API
 * gives an unauthenticated caller, which is what lets this work with no token
 * in the deployment.
 */
const STARS_TTL_SECONDS = 3600;

/**
 * The repository's star count, or `null` when GitHub does not answer.
 *
 * Null is a real outcome, not an error path to swallow quietly: the API is rate
 * limited per IP, a build machine may have no network, and a docs site that
 * fails to render because a badge could not load has its priorities backwards.
 * Callers render the GitHub link without a number instead.
 *
 * The `revalidate` here is what makes the count dynamic. It caches the response
 * for {@link STARS_TTL_SECONDS} and, because the fetch happens inside the two
 * layouts, gives every page the same revalidation interval — the count updates
 * on its own without a redeploy.
 */
export async function fetchStarCount(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: STARS_TTL_SECONDS },
    });
    if (!res.ok) return null;

    const repo: unknown = await res.json();
    const count = (repo as { stargazers_count?: unknown }).stargazers_count;
    return typeof count === 'number' ? count : null;
  } catch {
    return null;
  }
}

/**
 * GitHub's own compaction, so the badge reads the way the repository page does:
 * exact up to 999, then one decimal place — 1.2K, 12K.
 */
export function formatStarCount(count: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(count);
}
