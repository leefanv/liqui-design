import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// Exported once at build time and served as a static file; the dialog in
// `components/search.tsx` downloads it and searches in the browser.
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source);
