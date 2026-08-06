import { defineConfig, devices } from '@playwright/test';

/**
 * Visual regression for the glass, which is the one thing in this repo that
 * typechecking and building cannot tell you anything about. Several defects so
 * far — an SSR tier mismatch, unreadable preview text, a console error on a
 * documented pattern — passed every other check and were only visible on screen.
 *
 * Chromium only, on purpose: refraction does not render anywhere else, so a
 * WebKit or Firefox baseline would be a picture of the fallback and would go
 * stale silently the day WebKit ships the feature.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  expect: {
    toHaveScreenshot: {
      // The displacement map is generated per-pixel from a canvas, so a few
      // channels of drift across driver versions is expected. Anything that
      // matters visually moves far more than this.
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
      },
    },
  ],

  // Only manage a server when we are not pointed at one. Setting BASE_URL lets
  // the suite run against an already-running instance — the deployed site, or
  // the host's server from inside the Linux container used to make baselines.
  ...(process.env.BASE_URL
    ? {}
    : {
        webServer: {
          // `www...` is www *and its dependencies*. Plain `pnpm build` here runs
          // only this app's own script, which skips turbo and therefore never
          // builds packages/glass — fine on a machine where dist already exists,
          // a module-not-found on a clean checkout.
          command: 'pnpm --filter=www... build && pnpm start',
          url: 'http://localhost:4000',
          reuseExistingServer: !process.env.CI,
          timeout: 300_000,
        },
      }),
});
