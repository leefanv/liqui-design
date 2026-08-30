'use client';

import * as React from 'react';

import { ThemeEditorPanel } from '@/components/theme-editor/panel';
import { ThemePreview } from '@/components/theme-editor/preview';
import type { ColorMode } from '@/lib/theme';

/**
 * Preview left, dials right, on the page's own scrollbar.
 *
 * No inner scroll containers on purpose: the panel is much taller than the
 * preview, and giving each column its own overflow leaves a page with three
 * scrollbars and no obvious one to reach for. Instead the preview fills a
 * screen and sticks, so the left column is never a short box above a long
 * stretch of empty page, and whatever a dial does stays in front of you for the
 * whole length of the panel.
 *
 * The one piece of state the two share is which of the two token sets is being
 * edited. That is not the page's light/dark setting — you can tune the dark
 * palette from a light room — so it lives here rather than in the docs' theme
 * switch.
 *
 * `flex-col-reverse` below `lg`: the columns stack, and stacking them in DOM
 * order would put the dials under a full screen of preview.
 */
export function ThemeEditor() {
  const [mode, setMode] = React.useState<ColorMode>('dark');

  return (
    <div className="mt-6 flex flex-col-reverse gap-6 lg:flex-row">
      {/* Stretched, not `items-start`: the column has to be as tall as the
          panel beside it, or the sticky box inside would have nowhere to
          travel and would stop at the fold. */}
      <div className="min-w-0 flex-1">
        <div className="lg:sticky lg:top-20">
          <ThemePreview mode={mode} />
        </div>
      </div>
      <aside className="w-full shrink-0 lg:w-[21rem]">
        <ThemeEditorPanel mode={mode} onModeChange={setMode} />
      </aside>
    </div>
  );
}
