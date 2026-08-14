'use client';

import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from '@/registry/liqui/ui/tabs';

/**
 * Vertical costs nothing extra: the indicator positions itself from one
 * `translate` declaration that reads both `--active-tab-left` and
 * `--active-tab-top`, and only one of them is ever non-zero.
 */
export default function TabsVertical() {
  return (
    <Tabs orientation="vertical" defaultValue="material" className="flex max-w-md gap-5">
      <TabsList className="shrink-0">
        <TabsTab value="material">Material</TabsTab>
        <TabsTab value="motion">Motion</TabsTab>
        <TabsTab value="support">Support</TabsTab>
        <TabsIndicator />
      </TabsList>

      <div className="flex-1">
        <TabsPanel value="material" className="pt-1.5">
          Blur, tint and refraction are separate dials. Frost interpolates the
          first two toward Apple&rsquo;s regular variant in one number.
        </TabsPanel>
        <TabsPanel value="motion" className="pt-1.5">
          The pill interpolates its position and nothing else, so the lens keeps
          one size and one cached displacement map for the whole trip.
        </TabsPanel>
        <TabsPanel value="support" className="pt-1.5">
          Refraction renders in Chromium. Elsewhere the same surface falls back
          to frosted blur without anything in this file changing.
        </TabsPanel>
      </div>
    </Tabs>
  );
}
