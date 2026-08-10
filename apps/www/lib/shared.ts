export const appName = 'liqui';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'leefanv',
  repo: 'liqui-design',
  branch: 'main',
};

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
