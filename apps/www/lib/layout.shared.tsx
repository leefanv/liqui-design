import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { ArrowUpRight } from 'lucide-react';

import { Brand } from '@/components/brand';
import { GitHubStars } from '@/components/github-stars';
import { SiteHeader } from '@/components/site-header';
import { docsRoute, gallery, repoUrl, templatesRoute } from './shared';

/**
 * `docs` gives the header its sidebar controls. The header itself is ours
 * (see site-header); `links` still feed the docs sidebar's sheet on a phone.
 */
export function baseOptions({ docs = false }: { docs?: boolean } = {}): BaseLayoutProps {
  return {
    nav: {
      title: <Brand />,
      component: <SiteHeader docs={docs} />,
    },
    links: [
      { text: 'Docs', url: docsRoute, active: 'nested-url' },
      { text: 'Templates', url: templatesRoute, active: 'nested-url' },
      {
        // Off-site on purpose: the gallery is where the look is collected,
        // this site is where it becomes code. The arrow marks the hop.
        text: (
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            Gallery
            <ArrowUpRight className="size-3.5 opacity-60" />
          </span>
        ),
        url: gallery.url,
        external: true,
      },
      {
        // What `githubUrl` would have produced, but with the star count next to
        // the mark. Written out as an icon item so it lands where Fumadocs puts
        // GitHub already: top-right of the home nav, and bottom-left of the docs
        // sidebar, in the row it shares with the theme switch.
        //
        // No `label`: an aria-label would replace the link's text, and the count
        // inside it is the part worth announcing.
        type: 'icon',
        url: repoUrl,
        external: true,
        text: 'GitHub',
        icon: <GitHubStars />,
      },
    ],
  };
}
