/**
 * GA4 events the docs send beyond the automatic page views.
 *
 * The registry is a pile of static JSON behind a CDN, so a real `shadcn add`
 * never reaches this site — it resolves against an edge cache on someone
 * else's machine. What the docs *can* observe is the moment just before: a
 * visitor taking the install command away. Paired with the page views GA
 * already records for /docs/components/<name>, that gives a read → intent
 * funnel per component, which is the closest thing to an install count that
 * costs nothing to run and adds no request to the critical path.
 */
import { sendGAEvent } from '@next/third-parties/google';

/**
 * The two forms the docs publish. They resolve to the same registry item, and
 * which one a visitor takes is worth knowing on its own: the URL is a one-off,
 * while the namespaced form means they registered `@liqui-design` in their
 * components.json and expect to come back for a second component.
 */
export type InstallCommandStyle = 'url' | 'namespace';

export type InstallCommand = {
  /** Registry item name, as it appears in registry.json — e.g. `button`. */
  component: string;
  style: InstallCommandStyle;
};

const SHADCN_ADD = /\bshadcn(?:@[\w.-]+)?\s+add\s+(\S+)/;
// Pinned to our own host on purpose. `shadcn add` is the same command for every
// registry, and the day a doc page tells someone to pull a component from
// ui.shadcn.com an untightened pattern would quietly file that under our
// `button`.
const REGISTRY_URL = /^(?:https?:\/\/(?:[a-z0-9-]+\.)*liqui\.design)?\/r\/([a-z0-9-]+)\.json$/;
const NAMESPACED = /^@liqui-design\/([a-z0-9-]+)$/;

/**
 * Reads a copied code block and answers "was that an install command, and for
 * what". Anything else — the components.json snippet, a usage example, a
 * shadcn add pointing at somebody else's registry — returns null, because this
 * is not general "code was copied" tracking and a bare count of copies across
 * every block on the page would tell us nothing about which component won.
 */
export function parseInstallCommand(text: string | null | undefined): InstallCommand | null {
  const target = text?.match(SHADCN_ADD)?.[1];
  if (!target) return null;

  const url = target.match(REGISTRY_URL);
  if (url) return { component: url[1], style: 'url' };

  const namespaced = target.match(NAMESPACED);
  if (namespaced) return { component: namespaced[1], style: 'namespace' };

  return null;
}

export function trackInstallCommandCopied({ component, style }: InstallCommand): void {
  // The GA script is mounted in production builds only (see app/layout.tsx),
  // and sendGAEvent warns to the console when the dataLayer it wants is not
  // there. Matching that condition here keeps `next dev` quiet rather than
  // logging a warning every time someone copies a line locally.
  if (process.env.NODE_ENV !== 'production') return;

  // `component` and `command_style` are custom parameters: they arrive in
  // GA immediately, but only appear in reports once registered as custom
  // dimensions under Admin → Custom definitions.
  sendGAEvent('event', 'install_command_copied', { component, command_style: style });
}

/**
 * The theme editor's two questions.
 *
 * Deliberately not "a dial moved". A slider fires an event per frame of a drag,
 * and a count of those would say only that the page works — it cannot
 * distinguish someone tuning a palette from someone flicking a control on the
 * way past. The two moments that carry intent are the same two the rest of this
 * file already tracks: what people reach for, and what they take away.
 *
 * `theme_exported` is the editor's `install_command_copied` — the last thing
 * that happens before a theme leaves for somebody's project, and the only
 * observable proof the feature was used for its purpose rather than played
 * with. Which of the three forms they take is worth splitting: the CSS is the
 * palette, the provider is the optics, and a link means they are showing it to
 * someone rather than shipping it.
 *
 * `theme_preset_applied` answers the design question — of six looks, which ones
 * people actually start from. A preset nobody ever clicks is a preset to cut.
 */
export type ThemeExportKind = 'css' | 'provider' | 'link';

export function trackThemeExported(kind: ThemeExportKind): void {
  if (process.env.NODE_ENV !== 'production') return;
  sendGAEvent('event', 'theme_exported', { export_kind: kind });
}

export function trackThemePresetApplied(preset: string): void {
  if (process.env.NODE_ENV !== 'production') return;
  sendGAEvent('event', 'theme_preset_applied', { preset });
}
