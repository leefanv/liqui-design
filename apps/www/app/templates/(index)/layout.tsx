import { HomeLayout } from 'fumadocs-ui/layouts/home';

import { baseOptions } from '@/lib/layout.shared';
import { SiteFooter } from '@/components/site-footer';

/**
 * Chrome for the templates index only.
 *
 * `(index)` is a route group, so it adds nothing to the URL — `/templates` gets
 * the site nav and footer, `/templates/[slug]` is a sibling and gets neither.
 * The alternative, putting the index under `app/(home)/templates/`, would have
 * two subtrees declaring the same `templates` segment, which is the shape that
 * ends in a parallel-page conflict.
 */
export default function Layout({ children }: LayoutProps<'/templates'>) {
  return (
    <HomeLayout {...baseOptions()}>
      {children}
      <SiteFooter />
    </HomeLayout>
  );
}
