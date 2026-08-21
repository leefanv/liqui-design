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
  'menu',
  'menubar',
  'number-field',
  'popover',
  'progress',
  'radio-group',
  'select',
  'slider',
  'switch',
  'tabs',
  'toast',
  'toggle',
  'toggle-group',
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

test.describe('menu popup', () => {
  // The looped preview above captures a closed menu, which is a picture of a
  // button. The popup is the surface that carries the popup-scale optics, and
  // the thing worth looking at is the gap: it opens against a glass trigger,
  // and an overlap there would have the list refracting the button instead of
  // the page.
  test('the popup clears the trigger it hangs from', async ({ page }) => {
    await page.goto('/docs/components/menu');
    await waitForGlass(page);
    await page.getByRole('button', { name: 'View' }).click();
    await waitForGlass(page);
    await expect(page).toHaveScreenshot('menu-open.png');
  });
});

test.describe('menubar', () => {
  // Closed, the strip is the whole component and the preview above covers it.
  // Open is where the two decisions show at once: the trigger lit as a wash on
  // glass that is already there, and a popup sitting one bezel off the strip
  // rather than the eight a standalone menu needs.
  test('an open menu lights its trigger without adding a surface', async ({ page }) => {
    await page.goto('/docs/components/menubar');
    await waitForGlass(page);
    await page.getByRole('menuitem', { name: 'File' }).click();
    await waitForGlass(page);
    await expect(page).toHaveScreenshot('menubar-open.png');
  });
});

test.describe('toast column', () => {
  // The preview above is a picture of two buttons: the toasts are portalled to
  // the body and only exist once raised. This is the component's actual claim —
  // three surfaces in a column, each with the page behind it rather than the
  // toast in front of it — and there is no other way to see it.
  test('three toasts stay three separate surfaces', async ({ page }) => {
    await page.goto('/docs/components/toast');
    await waitForGlass(page);
    for (let i = 0; i < 3; i += 1) {
      await page.getByRole('button', { name: 'Notify' }).click();
    }
    await page.getByText('File 3 exported').waitFor();
    await waitForGlass(page);
    await expect(page).toHaveScreenshot('toast-column.png');
  });
});

test.describe('tabs indicator', () => {
  // The looped preview only ever captures the first tab, and the first tab is
  // the one place the pill's box coincides with the strip's own corner. Moving
  // it is what proves the lens travelled rather than being repainted: the pill
  // has to arrive at the same size, on a cached map, with its bezel bending the
  // backdrop it landed on.
  test('the pill refracts wherever it lands', async ({ page }) => {
    await page.goto('/docs/components/tabs');
    await waitForGlass(page);
    await page.getByRole('tab', { name: 'Rim' }).first().click();
    await waitForGlass(page);
    await expect(preview(page)).toHaveScreenshot('tabs-moved.png');
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
