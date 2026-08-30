'use client';

import * as React from 'react';
import { LiquiThemeProvider } from '@liqui-design/glass';
import type { LiquiTheme } from '@liqui-design/glass';

import {
  applyPatch,
  decodeTheme,
  defaultLiquiTheme,
  diffTheme,
  sanitisePatch,
  type ThemePatch,
} from '@/lib/theme';

/**
 * Holds the edited theme for the whole site.
 *
 * Mounted at the root rather than on `/theme`, because the point of a theme
 * editor is that you leave it and the docs are still wearing what you made —
 * every component page, every preview, the home stage. The editor is just the
 * one screen with the dials on it.
 *
 * Nothing is written to the DOM until the theme differs from the shipped one:
 * `LiquiThemeProvider` emits no `<style>` for an untouched palette and passes
 * identity scales, so for the overwhelming majority of readers this provider is
 * a context and nothing more.
 */

const STORAGE_KEY = 'liqui-theme-v1';
/** Query parameter carrying a shared theme, as written by "Copy link". */
const SHARE_PARAM = 't';

interface SiteThemeValue {
  theme: LiquiTheme;
  setTheme: (next: LiquiTheme) => void;
  reset: () => void;
  /** True until the stored theme has been read, so the UI can hold still. */
  loading: boolean;
}

const SiteThemeContext = React.createContext<SiteThemeValue>({
  theme: defaultLiquiTheme,
  setTheme: () => {},
  reset: () => {},
  loading: true,
});

export function useSiteTheme(): SiteThemeValue {
  return React.useContext(SiteThemeContext);
}

function readStored(): LiquiTheme | null {
  // A shared link wins over whatever is stored: someone following it asked to
  // see that theme, and silently showing them their own would be baffling.
  const shared = new URLSearchParams(window.location.search).get(SHARE_PARAM);
  if (shared) {
    const decoded = decodeTheme(shared);
    if (decoded) return decoded;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return applyPatch(sanitisePatch(JSON.parse(raw) as ThemePatch));
  } catch {
    // Private-mode localStorage throws on read; a malformed entry throws on
    // parse. Either way the shipped theme is the right answer.
    return null;
  }
}

export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<LiquiTheme>(defaultLiquiTheme);
  const [loading, setLoading] = React.useState(true);

  // A layout effect, not an effect: this runs after hydration commits but
  // before the browser paints, so a reader with a stored theme never sees a
  // frame of the shipped one. (The server can't render it — localStorage does
  // not exist there — so the alternative is a flash, not a better first paint.)
  React.useLayoutEffect(() => {
    const stored = readStored();
    if (stored) setThemeState(stored);
    setLoading(false);
  }, []);

  const setTheme = React.useCallback((next: LiquiTheme) => {
    setThemeState(next);
    try {
      const patch = diffTheme(next);
      if (Object.keys(patch).length === 0) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(patch));
    } catch {
      // Storage denied. The theme still applies for this session.
    }
  }, []);

  const reset = React.useCallback(() => setTheme(defaultLiquiTheme), [setTheme]);

  const value = React.useMemo(
    () => ({ theme, setTheme, reset, loading }),
    [theme, setTheme, reset, loading],
  );

  return (
    <LiquiThemeProvider theme={theme}>
      <SiteThemeContext.Provider value={value}>{children}</SiteThemeContext.Provider>
    </LiquiThemeProvider>
  );
}
