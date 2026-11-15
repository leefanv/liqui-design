'use client';

import type * as React from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { SidebarCollapseTrigger, useSidebar } from 'fumadocs-ui/components/sidebar/base';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { baseOptions } from '@/lib/layout.shared';
import { cn } from '@/lib/utils';

/**
 * The docs layout, on the client because of one prop.
 *
 * Notebook layout in `top` mode rather than the plain docs layout: a header
 * across every docs page — the same SiteHeader the home page wears — with the
 * sidebar below it holding only the page tree.
 *
 * The sidebar's own controls live at the foot of the sidebar, not in the
 * header: the header is for getting around the site, and collapsing the tree
 * is something you do to the tree. Fumadocs renders a `footer` given as a
 * node only on a phone; given as a component it renders it everywhere — and a
 * component cannot cross from a server layout into this client one, hence the
 * file.
 */
export function DocsShell({
  tree,
  children,
}: {
  tree: PageTree.Root;
  children: React.ReactNode;
}) {
  const base = baseOptions({ docs: true });
  return (
    <DocsLayout
      tree={tree}
      {...base}
      nav={{ ...base.nav, mode: 'top' }}
      sidebar={{ footer: SidebarFooter }}
      // Our header replaces Fumadocs' (see site-header), and Fumadocs' is what
      // would have told the grid how tall the header row is — the sidebar and
      // the table of contents stick below it.
      containerProps={{ style: { '--fd-header-height': '3.5rem' } as React.CSSProperties }}
    >
      {children}
      <ExpandSidebar />
    </DocsLayout>
  );
}

/**
 * The sidebar's foot: whatever Fumadocs puts there (on a phone, the GitHub
 * link and the light/dark switch), then Collapse. Shown at every width, where
 * Fumadocs' own class would hide it on a desk; Collapse itself is desk-only,
 * since on a phone the sidebar is a sheet that closes instead.
 */
function SidebarFooter({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={cn(className, 'flex items-center gap-1 border-t px-4 py-2.5')}>
      {children}
      <SidebarCollapseTrigger
        className="ms-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground max-md:hidden"
      >
        <PanelLeftClose className="size-4" />
        Collapse
      </SidebarCollapseTrigger>
    </div>
  );
}

/**
 * The way back once the sidebar is collapsed. Fumadocs reveals a collapsed
 * sidebar when the pointer reaches the window's left edge, which nobody finds
 * by accident; this sits in the corner the Collapse button was in.
 */
function ExpandSidebar() {
  const { collapsed } = useSidebar();
  if (!collapsed) return null;
  return (
    <SidebarCollapseTrigger
      aria-label="Expand sidebar"
      className="fixed bottom-4 left-4 z-30 inline-flex h-9 items-center gap-1.5 rounded-full bg-fd-secondary px-3.5 text-[13px] text-fd-muted-foreground shadow-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground max-md:hidden"
    >
      <PanelLeftOpen className="size-4" />
      Sidebar
    </SidebarCollapseTrigger>
  );
}
