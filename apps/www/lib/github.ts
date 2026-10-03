import { gitConfig } from './shared';

/**
 * How long a star count stays good for in this browser tab. The number moves
 * slowly, and remembering it keeps a reader clicking through the docs to one
 * GitHub call per session — well inside the 60/hour the API gives each visitor's
 * IP without a token.
 */
const STARS_TTL_MS = 60 * 60 * 1000;
const STARS_CACHE_KEY = 'liqui:github-stars';

/**
 * The repository's star count, or `null` when GitHub does not answer.
 *
 * Null is a real outcome, not an error path to swallow quietly: the API is rate
 * limited per IP and may be blocked outright, and a nav that breaks because a
 * badge could not load has its priorities backwards. Callers render the GitHub
 * link without a number instead.
 *
 * This runs in the browser, not during rendering. A fetch with `revalidate` in
 * the shared layouts gave every page an hourly revalidation, so each page was
 * re-rendered and re-written to the ISR cache every hour it was visited — all
 * to move one number. Fetched here, the pages stay fully static.
 */
export async function fetchStarCount(): Promise<number | null> {
  const cached = readCache();
  if (cached !== null) return cached;

  try {
    const res = await fetch(`https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;

    const repo: unknown = await res.json();
    const count = (repo as { stargazers_count?: unknown }).stargazers_count;
    if (typeof count !== 'number') return null;

    writeCache(count);
    return count;
  } catch {
    return null;
  }
}

// Storage can throw (private mode, blocked site data); a miss just means a fetch.
function readCache(): number | null {
  try {
    const raw = sessionStorage.getItem(STARS_CACHE_KEY);
    if (!raw) return null;
    const { count, at } = JSON.parse(raw) as { count: number; at: number };
    return Date.now() - at < STARS_TTL_MS ? count : null;
  } catch {
    return null;
  }
}

function writeCache(count: number) {
  try {
    sessionStorage.setItem(STARS_CACHE_KEY, JSON.stringify({ count, at: Date.now() }));
  } catch {}
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
