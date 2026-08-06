import type { Page, Locator } from '@playwright/test';

/**
 * Glass is not settled when the page is "loaded".
 *
 * Three things happen after first paint, and a screenshot taken before they
 * finish is a different image every run:
 *
 * 1. The surface is measured, then a displacement map is generated on a canvas
 *    at that size. Until then there is no refraction at all.
 * 2. The map goes into an `feImage`, which decodes asynchronously. Chromium
 *    treats the filter as inert while that happens.
 * 3. A cold filter fades its refraction in over ~180ms, and the kernel removes
 *    the fade class once it has played.
 *
 * Playwright's `animations: 'disabled'` handles CSS animations but not (1) or
 * (2), and not the JS timer that strips the class. Waiting for the fade classes
 * to disappear covers all three: the class only exists once a filter has been
 * created, and only goes away after the animation has run.
 */
export async function waitForGlass(page: Page) {
  // `state: 'attached'`, not the default `visible`. Menus keep their portal
  // mounted while closed so the filter survives — so the first .liqui-glass on
  // a context menu page is a closed, invisible popup, and waiting for
  // visibility hangs forever on it.
  //
  // Prose pages have no glass at all; there is nothing to settle, so a miss
  // here is not a failure.
  const present = await page
    .waitForSelector('.liqui-glass', { state: 'attached', timeout: 5_000 })
    .catch(() => null);

  if (!present) {
    await settle(page);
    return;
  }

  await page.waitForFunction(
    () =>
      document.querySelectorAll(
        '.liqui-glass__refract--fade, .liqui-glass__specular--fade',
      ).length === 0,
    undefined,
    { timeout: 15_000 },
  );

  // Every surface that takes up space should have its refract layer by now. If
  // one hasn't, detection fell back and the comparison would be against the
  // wrong tier — better to fail loudly than to bless a frosted-blur baseline as
  // correct.
  //
  // Scoped to surfaces with a box on purpose. A closed keep-mounted popup
  // measures 0×0, and the kernel will not build a displacement map for a size
  // it cannot read, so those legitimately have no refract layer until opened.
  await page.waitForFunction(
    () => {
      const surfaces = [...document.querySelectorAll('.liqui-glass--refract')].filter(
        (el) => el.getBoundingClientRect().width > 0,
      );
      return surfaces.every((el) => el.querySelector(':scope > .liqui-glass__refract') !== null);
    },
    undefined,
    { timeout: 15_000 },
  );

  await settle(page);
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // One more frame so the last paint lands.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
}

/** A docs preview surface, without the surrounding page chrome. */
export function preview(page: Page, index = 0): Locator {
  return page.locator('[data-preview]').nth(index);
}

/** The interactive stage on the home page. */
export function stage(page: Page): Locator {
  return page.locator('[data-glass-stage]');
}
