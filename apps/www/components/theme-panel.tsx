'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Maximize2, X } from 'lucide-react';

import { themeRoute } from '@/lib/shared';
import type { ColorMode } from '@/lib/theme';
import { PlainButton } from '@/components/theme-editor/controls';
import { cn } from '@/lib/utils';

/**
 * The theme editor as a panel docked to the right edge of any page.
 *
 * The theme already lives at the root (see SiteThemeProvider), so every page
 * has always been wearing it; what was missing was a way to reach the dials
 * from where the components are. The panel is the same one /theme hosts, and
 * the page beside it is the preview.
 *
 * - **Docked, not floating.** It takes a column of the window and the page
 *   makes room — the body is padded by the panel's width (see global.css) —
 *   so nothing is covered and it reads as part of the app, an inspector,
 *   rather than a popup over it. On a docs page it takes the table of
 *   contents' column, which there is no room for beside it.
 * - **One reflow per toggle.** Making room resizes the surfaces on the page,
 *   and a resized surface rebuilds its map — once, on open and on close. The
 *   width is never animated, which would rebuild them every frame; only the
 *   panel's own slide is, and a translate costs nothing.
 * - **Loaded on first open,** as a separate chunk.
 * - **Mounted in the root layout,** so it stays open across navigation, and
 *   remembered for the tab, so a reload does not shut it.
 * - Below `md` there is no column to spare, so it covers the page under the
 *   header instead.
 */

const ThemeEditorPanel = React.lazy(() =>
  import('@/components/theme-editor/panel').then((m) => ({ default: m.ThemeEditorPanel })),
);
const ThemeEditorFooter = React.lazy(() =>
  import('@/components/theme-editor/panel').then((m) => ({ default: m.ThemeEditorFooter })),
);

/** The class global.css keys the page's room-making on. */
const OPEN_CLASS = 'theme-panel-open';
const STORAGE_KEY = 'liqui-theme-panel-open';

interface ThemePanelValue {
  open: boolean;
  setOpen: (next: boolean) => void;
}

const ThemePanelContext = React.createContext<ThemePanelValue>({
  open: false,
  setOpen: () => {},
});

export function useThemePanel() {
  return React.useContext(ThemePanelContext);
}

export function ThemePanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = React.useState(false);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setOpenState(true);
    } catch {
      // Storage denied: the panel just starts shut.
    }
  }, []);

  const setOpen = React.useCallback((next: boolean) => {
    setOpenState(next);
    try {
      if (next) sessionStorage.setItem(STORAGE_KEY, '1');
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // As above.
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle(OPEN_CLASS, open);
  }, [open]);

  const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <ThemePanelContext.Provider value={value}>
      {children}
      <ThemePanel />
    </ThemePanelContext.Provider>
  );
}

/** Which token set the page is showing — the one worth editing first. */
function pageMode(): ColorMode {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function ThemePanel() {
  const { open, setOpen } = useThemePanel();
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = React.useState<ColorMode>('light');
  // Mounted from the first open on, so the panel can slide out as well as in
  // and keeps its scroll position between toggles.
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setMounted(true);
    setMode(pageMode());
  }, [open]);

  // /theme hosts the same panel in full; a second copy beside it is noise.
  React.useEffect(() => {
    if (pathname === themeRoute) setOpen(false);
  }, [pathname, setOpen]);

  if (!mounted) return null;

  return (
    <aside
      aria-label="Theme settings"
      data-open={open}
      inert={!open}
      className={cn(
        'fixed right-0 z-40 flex flex-col bg-fd-background text-fd-foreground',
        'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        'translate-x-full data-[open=true]:translate-x-0',
        // A column of the window on a desk: full height, beside the header
        // rather than under it, since the page — header included — has moved
        // over to make room.
        'md:inset-y-0 md:w-(--lq-theme-panel-w) md:border-l md:border-fd-border',
        // On a phone, the page under the header.
        'max-md:inset-x-0 max-md:top-14 max-md:bottom-0',
      )}
    >
      <header className="flex h-14 flex-none items-center gap-1 border-b border-fd-border pr-2 pl-4">
        <h2 className="mr-auto text-[13px] font-semibold">Theme</h2>
        <PlainButton
          variant="ghost"
          title="Open the full editor, with a preview beside it"
          onClick={() => router.push(themeRoute)}
        >
          <Maximize2 className="size-3.5" />
          Full editor
        </PlainButton>
        <PlainButton variant="ghost" aria-label="Close" className="px-2" onClick={() => setOpen(false)}>
          <X className="size-4" />
        </PlainButton>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
        <React.Suspense
          fallback={<p className="px-4 py-6 text-[12px] text-fd-muted-foreground">Loading…</p>}
        >
          <ThemeEditorPanel mode={mode} onModeChange={setMode} />
        </React.Suspense>
      </div>
      {/* Pinned, not the last row of the scroll: the two actions that act on
          the whole theme stay in reach however far down the dials you are. */}
      <React.Suspense fallback={null}>
        <ThemeEditorFooter className="flex-none" />
      </React.Suspense>
    </aside>
  );
}
