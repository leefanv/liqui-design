/**
 * Two names, used in two ways. `appName` is what the project is called in
 * running prose and on the command line — the package is `@liqui-design/glass`
 * and nobody types the capitals. `brandName` is the full name, for the places
 * that present the project rather than talk about it: the mark in the nav, the
 * browser tab, the social card.
 */
export const appName = 'liqui';
export const brandName = 'Liqui Design';

export const docsRoute = '/docs';
export const templatesRoute = '/templates';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

/**
 * GA4 measurement ID. Public by design — it ships in the page source of every
 * site that uses it, so there is nothing gained by moving it into an env var.
 */
export const googleAnalyticsId = 'G-WD95MFJ6ZJ';

export const gitConfig = {
  user: 'leefanv',
  repo: 'liqui-design',
  branch: 'main',
};

export const repoUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

/**
 * Every outbound link to the gallery carries `ref` so the traffic the docs send
 * over is attributable on the other side. Built here rather than written into
 * the copy, because a hand-written URL is exactly where the parameter goes
 * missing — and where `?cat=dev&ref=` turns into a second `?`.
 */
function galleryUrl(path: string, query?: Record<string, string>): string {
  const url = new URL(path, 'https://liquidglassdesign.com');
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);
  url.searchParams.set('ref', 'liqui.design');
  return url.toString();
}

/**
 * liqui came out of Liquid Glass Design, the gallery of liquid-glass work the
 * same author curates. The two sites stay separate and cross-link: the gallery
 * is where the look is collected, liqui is where it becomes installable code.
 * Kept here so the copy on the home page, the footer and the docs all point at
 * the same URLs.
 *
 * Deliberately no reference count: the gallery grows, and a number baked into
 * this site is a number that is wrong a month from now.
 */
export const gallery = {
  name: 'Liquid Glass Design',
  url: galleryUrl('/'),
  resources: galleryUrl('/resources'),
  devResources: galleryUrl('/resources', { cat: 'dev' }),
  guide: galleryUrl('/what-is-liquid-glass'),
};

/**
 * Where the built registry is served from. Users either hit these URLs directly
 * or register `"@liqui": "<siteUrl>/r/{name}.json"` in their components.json.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000');
