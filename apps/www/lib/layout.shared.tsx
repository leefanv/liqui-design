import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { ArrowUpRight } from 'lucide-react';

import { appName, docsRoute, gallery, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
    },
    links: [
      { text: 'Docs', url: docsRoute, active: 'nested-url' },
      {
        // Off-site on purpose: the gallery is where the look is collected,
        // this site is where it becomes code. The arrow marks the hop.
        text: (
          <>
            Gallery
            <ArrowUpRight className="size-3.5 opacity-60" />
          </>
        ),
        url: gallery.url,
        external: true,
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
