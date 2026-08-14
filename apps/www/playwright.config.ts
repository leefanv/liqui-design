import { defineConfig, devices } from '@playwright/test';

/**
 * Two suites, run in different places.
 *
 * `checks.spec.ts` is what CI runs: console errors, layout invariants and
 * filter-cache behaviour, each asserted directly. No baselines, so nothing here
 * drifts with a graphics-stack update.
 *
 * `visual.spec.ts` is the screenshot suite, and it is a local tool. It keeps
 * baselines only for the platform you run it on, because keeping a second set
 * for CI's Linux meant generating them in an emulated amd64 container and put
 * "can I add a component" at the mercy of a local Docker daemon. It was also
 * worth less than it looked: a baseline catches a *change* against the last
 * accepted render, never a render that was wrong to begin with — twice now the
 * suite has locked a defect into a baseline and stayed green through it.
 * Visual acceptance is a human's job here.
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
      // The displacement map is generated per-pixel from a canvas, and the
      // result is not bit-stable between runs on one machine: measured
      // run-to-run jitter on the tooltip and handbook previews is 400–1,000
      // pixels with nothing changed at all. This bound is sized for that.
      //
      // Which means it is also a blind spot worth knowing about. On a 663×320
      // preview, 1% is ~2,100 pixels — more than a whole tooltip tail, and in
      // fact a tail was added, restyled and removed under this bound without
      // ever failing a test. Tightening it just trades the blind spot for a
      // flaky suite. Treat a green run as "nothing large moved", not as
      // "nothing moved", and look at the previews yourself.
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
  // the suite run against an already-running instance — a `next start` you are
  // keeping warm across several runs, or the deployed site.
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
