'use client';

import { Toolbar, ToolbarButton, ToolbarSeparator } from '@/registry/liqui/ui/toolbar';

/**
 * Turned upright, the strip is still one surface and the separator's highlight
 * moves with it — the light stays where it was, so the lit wall of the cut
 * changes sides.
 */
export default function ToolbarVertical() {
  return (
    <Toolbar orientation="vertical" aria-label="Tools" className="w-36">
      <ToolbarButton>Select</ToolbarButton>
      <ToolbarButton>Move</ToolbarButton>
      <ToolbarSeparator orientation="horizontal" />
      <ToolbarButton>Pen</ToolbarButton>
      <ToolbarButton>Shape</ToolbarButton>
      <ToolbarButton disabled>Mesh</ToolbarButton>
    </Toolbar>
  );
}
