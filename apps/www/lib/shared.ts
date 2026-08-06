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
 * Where the built registry is served from. Users either hit these URLs directly
 * or register `"@liqui": "<siteUrl>/r/{name}.json"` in their components.json.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000');
