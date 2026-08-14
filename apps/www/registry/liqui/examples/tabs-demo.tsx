'use client';

import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from '@/registry/liqui/ui/tabs';

/**
 * The pill is the only glass here. Watch its rim as it travels: it is picking up
 * whatever the strip is lying on, which is the point of putting the lens on the
 * part that moves.
 */
export default function TabsDemo() {
  return (
    <Tabs defaultValue="lens" className="max-w-sm">
      <TabsList>
        <TabsTab value="lens">Lens</TabsTab>
        <TabsTab value="tint">Tint</TabsTab>
        <TabsTab value="rim">Rim</TabsTab>
        <TabsIndicator />
      </TabsList>

      <TabsPanel value="lens" className="min-h-20">
        A signed distance field gives every pixel its depth into the bezel, and a
        per-profile lookup table turns that depth into how far the backdrop is
        displaced there.
      </TabsPanel>
      <TabsPanel value="tint" className="min-h-20">
        The tint is a gradient between two tokens, not a fill. Retinting is how
        every stateful component in liqui shows state without losing the glass.
      </TabsPanel>
      <TabsPanel value="rim" className="min-h-20">
        The specular layer is a generated image of the light along the profile —
        a key light toward the top left, a dimmer counter-light opposite it.
      </TabsPanel>
    </Tabs>
  );
}
