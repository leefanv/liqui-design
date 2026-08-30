import { expect, test, type Locator } from '@playwright/test';

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
    // The third trigger that has to opt out of the native button, and the one
    // whose documented snippet says so — which is how the warning got out last
    // time.
    '/docs/components/menu',
    // The one component with a provider around it, whose viewport is portalled
    // and fixed — mounted on the directory page too, where a second viewport
    // would show up.
    '/docs/components/toast',
    // Two more triggers that have to opt out of the native button, and the two
    // components whose Base UI parts warn loudest when they are assembled
    // wrongly: a combobox whose label belongs to the trigger rather than the
    // input, and a drawer whose trigger is handed a liqui Button.
    '/docs/components/combobox',
    '/docs/components/drawer',
    // A single popup shared by several triggers, portalled, with a viewport
    // inside it — and the one place a tail is rendered inside a popup that
    // clips.
    '/docs/components/navigation-menu',
    // The page that catches an unstable ref forwarded into a composite list. A
    // slider thumb is a composite item, so a `LiquiGlass` that re-attaches its
    // handle every render unregisters the thumb every render, and Base UI
    // schedules a state update each time — an infinite loop on a page nobody
    // touched. The templates below caught it first, but they catch it three
    // components deep; this localises it.
    '/docs/components/slider',
    '/docs/handbook/glass',
    // The theme editor drives every surface on the page from one provider, and
    // it is the only place a `radiusScale` or `bezelScale` other than 1 is ever
    // in play — which is where a scaled value that reaches the map generator
    // wrong would surface.
    '/theme',
    // The templates. A whole page of glass at once is where a surface that
    // misbehaves at density shows up, and the index renders a template inside a
    // scaled container — the one place a map could be built at the wrong size.
    '/templates',
    '/templates/media-player',
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
    const strip = page.locator('[role="tablist"]').first();
    const block = page.locator('[role="tabpanel"]:not([hidden]) figure').first();

    // Click and measure together, and retry the pair.
    //
    // Two things go wrong if this runs once. A click that lands before the page
    // has hydrated does nothing at all, leaving Preview visible — and Preview
    // holds a live component, not a code block, so there is nothing to measure.
    // A click that lands *during* hydration switches the tab and then re-mounts
    // it, so a handle resolved a moment earlier is measuring a detached node and
    // reads null. Neither is worth a fixed wait: hydration here is gated on a
    // lazy component map that grows with every demo added to the registry, so
    // any number picked today is wrong later. Clicking a tab that is already
    // active is a no-op, which is what makes retrying the whole thing safe.
    await expect(async () => {
      await page.getByRole('tab', { name: 'Code' }).click();

      const stripBox = await strip.boundingBox();
      const blockBox = await block.boundingBox();
      expect(stripBox, 'tab strip has no box').not.toBeNull();
      expect(blockBox, 'code block has no box').not.toBeNull();

      // Fumadocs gives a code block inside a tab a negative margin sized to
      // cancel the panel's own padding. Removing that padding — which is the
      // right thing to do for the preview panel, and was wrong here — leaves
      // the negative margin uncancelled and the block bleeds up over the tabs.
      // Geometry rather than a screenshot: it states the invariant exactly and
      // costs no baseline.
      expect(blockBox!.y).toBeGreaterThanOrEqual(stripBox!.y + stripBox!.height - 1);
    }).toPass();
  });
});

test.describe('the New badge', () => {
  // The badge is derived from ship dates rather than a hand-kept list, so it is
  // *supposed* to reach zero — a test asserting one exists would come true only
  // until the newest component turns thirty days old, and then fail on a
  // Tuesday for no reason.
  //
  // What can be asserted at any moment is that the two places showing it agree.
  // The sidebar gets its badge from a page-tree plugin and the directory tiles
  // render one directly, which are different code paths onto the same data: if
  // a Fumadocs upgrade quietly drops `transformPageTree`, the sidebar empties
  // while the tiles carry on, and that is a difference. Both empty is also
  // agreement, which is what keeps this green a month from now.
  test('the sidebar and the directory mark the same components', async ({ page }) => {
    await page.goto('/docs/components');
    await waitForGlass(page);

    const named = async (scope: Locator) =>
      (
        await scope
          .locator('a[href^="/docs/components/"]')
          .filter({ hasText: 'New' })
          .evaluateAll((links) =>
            links.map((link) => link.getAttribute('href')!.split('/').pop()!),
          )
      ).sort();

    const sidebar = await named(page.locator('#nd-sidebar'));
    // A tile's badge sits beside the link rather than inside it, so the filter
    // above would miss it; the heading is the element that holds both.
    const tiles = (
      await page
        // The tiles are the only h3s on the page; the sidebar is links.
        .locator('h3')
        .filter({ hasText: 'New' })
        .evaluateAll((headings) =>
          headings.map((h) => h.querySelector('a')?.getAttribute('href')?.split('/').pop() ?? ''),
        )
    )
      .filter(Boolean)
      .sort();

    expect(sidebar).toEqual(tiles);
    // The cap in lib/whats-new.tsx. A window with no cap lights the whole
    // sidebar the week a batch lands, which is the failure this number exists
    // to prevent — so it is worth failing here if it ever stops being applied.
    expect(sidebar.length).toBeLessThanOrEqual(6);
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

    // Polled, not sampled once. The helper waits for the fade classes to be
    // gone, and "gone" is also true in the moment before the first filter has
    // been built — so on a page that mounts every demo at once, a single read
    // can land in that window and see nothing. Retrying distinguishes "not yet"
    // from "never", which is the thing this test is actually about.
    await expect.poll(() => page.locator('.liqui-glass--refract').count()).toBeGreaterThan(0);
  });
});

test.describe('install command tracking', () => {
  test('copying an install command reports the component, and nothing else does', async ({
    page,
    context,
  }) => {
    // The event is read out of gtag's dataLayer, which the inline init script
    // creates. Blocking the tag itself keeps a CI run from filing hits against
    // the real property while leaving the queue this asserts on intact.
    await page.route('**://*.googletagmanager.com/**', (route) => route.abort());
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const events = () =>
      page.evaluate(() =>
        ((window as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? [])
          .map((entry) => Array.from(entry))
          .filter((args) => args[0] === 'event'),
      );

    await page.goto('/docs/components/button');

    const copy = async (command: string) => {
      const block = page.locator('figure', { hasText: command }).first();
      await block.hover();
      await block.locator('button').first().click();
    };

    // Retried as a pair: a click that lands before hydration reaches the
    // listener does nothing, and there is no event to wait for instead. Copying
    // the same block twice would only push the same event twice, so retrying is
    // safe — which is why the assertions below are containment rather than
    // equality.
    await expect(async () => {
      await copy('npx shadcn@latest add https://liqui.design/r/button.json');
      expect(await events()).toContainEqual([
        'event',
        'install_command_copied',
        { component: 'button', command_style: 'url' },
      ]);
    }).toPass();

    // The second form the docs publish. Same item, different signal: it means
    // the visitor registered the namespace and expects to come back.
    await copy('npx shadcn@latest add @liqui-design/button');
    expect(await events()).toContainEqual([
      'event',
      'install_command_copied',
      { component: 'button', command_style: 'namespace' },
    ]);

    // Every code block on the page shares the same listener, so the parser is
    // what keeps this from becoming a meaningless count of copies. The
    // components.json snippet contains a registry URL and must still report
    // nothing.
    const before = (await events()).length;
    await copy('"registries"');
    expect(await events()).toHaveLength(before);
  });
});
