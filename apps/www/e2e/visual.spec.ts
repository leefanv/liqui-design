import { expect, test } from '@playwright/test';

import { preview, stage, waitForGlass } from './glass';

const COMPONENTS = [
  'accordion',
  'alert-dialog',
  'button',
  'checkbox',
  'context-menu',
  'field',
  'select',
  'slider',
  'switch',
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

    const handle = page.getByText('drag me over an edge');
    const box = await handle.boundingBox();
    if (!box) throw new Error('drag handle not found');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 160, box.y + box.height / 2 - 100, { steps: 12 });
    await page.mouse.up();

    // Moving the surface must not regenerate anything: the map is keyed on size
    // and optics, neither of which changed. A fade class reappearing here would
    // mean a filter was recreated on a plain translate.
    await expect(page.locator('.liqui-glass__refract--fade')).toHaveCount(0);
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

test.describe('no console errors', () => {
  for (const path of [
    '/',
    '/docs',
    '/docs/components/alert-dialog',
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
