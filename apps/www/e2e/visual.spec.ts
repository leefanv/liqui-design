import { expect, test } from '@playwright/test';

import { dragSurface, preview, stage, waitForGlass } from './glass';

/**
 * The screenshot suite — a local tool, not a CI gate.
 *
 * It runs on whatever platform you are on and keeps baselines only for that
 * platform (`-chromium-darwin.png` here). CI does not run it: matching CI's
 * Linux rendering from a developer machine meant generating a second set of
 * baselines inside an emulated amd64 container, which put "can I add a
 * component" at the mercy of a local Docker daemon and bought less than it
 * looked like. Baselines catch *changes* against the last accepted render; they
 * cannot catch a render that was wrong to begin with, and twice now they have
 * faithfully locked in a defect and stayed green. Visual acceptance is a
 * human's job here; this suite is for the diff you get afterwards.
 *
 * Use it before and after a change that touches the optics:
 *
 *     pnpm --filter www test:visual           # compare against your baselines
 *     pnpm --filter www test:visual:update    # accept the new render
 *
 * See `checks.spec.ts` for what CI does run.
 */

const COMPONENTS = [
  'accordion',
  'alert-dialog',
  'button',
  'checkbox',
  'context-menu',
  'dialog',
  'field',
  'popover',
  'select',
  'slider',
  'switch',
  'tooltip',
];

test.describe('component previews', () => {
  for (const name of COMPONENTS) {
    test(name, async ({ page }) => {
      await page.goto(`/docs/components/${name}`);
      await waitForGlass(page);
      await expect(preview(page)).toHaveScreenshot(`${name}.png`);
    });
  }
});

test.describe('select popup', () => {
  // The looped preview above only ever captures a closed select, which is a
  // picture of the trigger. The popup is the component's real surface — the one
  // carrying the popup-scale optics — and it is only on screen while open.
  test('the popup is a refracting surface, not the frost fallback', async ({ page }) => {
    await page.goto('/docs/components/select');
    await waitForGlass(page);
    await page.getByRole('combobox').click();
    await waitForGlass(page);
    await expect(preview(page)).toHaveScreenshot('select-open.png');
  });
});

test.describe('overlays while open', () => {
  // Same reasoning as the select popup: the looped previews above capture a
  // closed trigger, and for these three the component *is* the surface that
  // only exists while open. The popover's tail in particular wears the popup's
  // material without its lens, which is exactly the kind of thing that goes
  // subtly wrong without failing anything else.
  test('popover', async ({ page }) => {
    await page.goto('/docs/components/popover');
    await waitForGlass(page);
    await page.getByRole('button', { name: 'Notifications' }).click();
    await waitForGlass(page);
    await expect(preview(page)).toHaveScreenshot('popover-open.png');
  });

  test('dialog', async ({ page }) => {
    await page.goto('/docs/components/dialog');
    await waitForGlass(page);
    await page.getByRole('button', { name: 'Share workspace' }).click();
    await waitForGlass(page);
    // The popup is portalled to the body and sits over a full-page scrim, so
    // the preview box is not where it renders.
    await expect(page).toHaveScreenshot('dialog-open.png');
  });

  test('tooltip', async ({ page }) => {
    await page.goto('/docs/components/tooltip');
    await waitForGlass(page);
    await page.getByRole('button', { name: 'Undo' }).hover();
    await waitForGlass(page);
    await expect(preview(page)).toHaveScreenshot('tooltip-open.png');
  });
});

test.describe('home stage', () => {
  test('default optics', async ({ page }) => {
    await page.goto('/');
    await waitForGlass(page);
    await expect(stage(page)).toHaveScreenshot('home-aurora.png');
  });

  test('grid backdrop shows the displacement clearly', async ({ page }) => {
    await page.goto('/');
    await waitForGlass(page);
    await page.getByRole('button', { name: 'Grid' }).click();
    await waitForGlass(page);
    await expect(stage(page)).toHaveScreenshot('home-grid.png');
  });

  test('dragging moves the surface without disturbing the optics', async ({ page }) => {
    await page.goto('/');
    await waitForGlass(page);
    await dragSurface(page);
    // The invariant behind this picture — that no filter was rebuilt — is
    // asserted directly in checks.spec.ts. This is the look of it.
    await expect(stage(page)).toHaveScreenshot('home-dragged.png');
  });
});

test.describe('the material', () => {
  test('a flat backdrop leaves nothing to refract', async ({ page }) => {
    await page.goto('/docs/handbook/glass');
    await waitForGlass(page);
    // The handbook makes its point by showing the same component on a flat
    // fill. If this ever stops looking flat, the page's argument is broken.
    await expect(page.locator('[data-preview="flat"]')).toHaveScreenshot('handbook-flat.png');
  });
});
