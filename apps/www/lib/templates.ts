import { Index, type RegistryEntry } from '@/registry/__index__';

/**
 * The registry, narrowed to the items that are whole pages.
 *
 * `Index` holds every previewable item, which is mostly component demos. The
 * filter is what keeps `/templates/button-demo` from rendering a lone button
 * full-screen, and it is why the routes below can take their params straight
 * from the registry instead of maintaining a second list that would drift.
 */
export function getTemplates(): RegistryEntry[] {
  return Object.values(Index).filter((entry) => entry.type === 'registry:block');
}

export function getTemplate(slug: string): RegistryEntry | undefined {
  const entry = Index[slug];
  return entry?.type === 'registry:block' ? entry : undefined;
}

/** What a visitor runs to get the template into their own project. */
export function installCommand(name: string, siteUrl: string): string {
  return `npx shadcn@latest add ${siteUrl}/r/${name}.json`;
}
