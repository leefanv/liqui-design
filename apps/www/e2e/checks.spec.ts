import { expect, test } from '@playwright/test';

import { dragSurface, waitForGlass } from './glass';

/**
 * The checks CI runs.
 *
 * Everything here states an invariant directly rather than by comparing pixels,
 * so it needs no baseline, cannot drift with a graphics-stack update, and gives
 * a legible failure. `visual.spec.ts` holds the screenshot suite, which is a
 * local tool — see CONTRIBUTING.
 */

test.describe('no console errors', () => {
  for (const path of [
    '/',
    '/docs',
    // The directory mounts every demo at once — the one page where a component
    // that misbehaves off its own page has somewhere to show up.
    '/docs/components',
    '/docs/components/alert-dialog',
    // Two floating surfaces, a trigger that has to opt out of the native
    // button and one that must not, and a second demo that pins four tooltips
    // open at once.
    '/docs/components/popover',
    '/docs/components/tooltip',
    '/docs/components/select',
    '/docs/handbook/glass',
  ]) {
    test(path, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(String(e)));

      await page.goto(path);
      await waitForGlass(page);

      // Favicon 404s are noise; anything else is a defect. The Base UI
      // nativeButton warning reached production once through a documented
      // snippet, which is why this check exists at all.
      expect(errors.filter((e) => !/favicon|404/i.test(e))).toEqual([]);
    });
  }
});

test.describe('code tab', () => {
  test('the code block does not overlap the tab strip', async ({ page }) => {
    await page.goto('/docs/components/accordion');
    await waitForGlass(page);
    await page.getByRole('tab', { name: 'Code' }).click();

    const strip = await page.locator('[role="tablist"]').first().boundingBox();
    const block = await page
      .locator('[role="tabpanel"]:not([hidden]) figure')
      .first()
      .boundingBox();
    if (!strip || !block) throw new Error('tab strip or code block not found');

    // Fumadocs gives a code block inside a tab a negative margin sized to cancel
    // the panel's own padding. Removing that padding — which is the right thing
    // to do for the preview panel, and was wrong here — leaves the negative
    // margin uncancelled and the block bleeds up over the tabs. Geometry rather
    // than a screenshot: it states the invariant exactly and costs no baseline.
    expect(block.y).toBeGreaterThanOrEqual(strip.y + strip.height - 1);
  });
});

test.describe('the filter registry', () => {
  test('dragging a surface does not rebuild its filter', async ({ page }) => {
    await page.goto('/');
    await waitForGlass(page);
    await dragSurface(page);

    // Moving the surface must not regenerate anything: the map is keyed on size
    // and optics, neither of which changed. A fade class reappearing here would
    // mean a filter was recreated on a plain translate — the cache miss that
    // used to make every popup open look like lag.
    await expect(page.locator('.liqui-glass__refract--fade')).toHaveCount(0);
  });

  test('every laid-out surface reaches the refraction tier', async ({ page }) => {
    await page.goto('/docs/components');
    // waitForGlass already fails if a surface with a box is missing its refract
    // layer. Asserting the count here as well turns "the helper timed out" into
    // "the directory rendered N surfaces and none of them refracted", which is
    // the difference between an SSR tier mismatch and a slow machine.
    await waitForGlass(page);

    const surfaces = page.locator('.liqui-glass--refract');
    expect(await surfaces.count()).toBeGreaterThan(0);
  });
});
