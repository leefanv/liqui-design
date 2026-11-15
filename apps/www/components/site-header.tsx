'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarTrigger, useSidebar } from 'fumadocs-ui/components/sidebar/base';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { ArrowUpRight, Menu, PaintBucket, PanelLeft, Search } from 'lucide-react';

import { Brand } from '@/components/brand';
import { GitHubStars } from '@/components/github-stars';
import { useThemePanel } from '@/components/theme-panel';
import { docsRoute, gallery, repoUrl, templatesRoute } from '@/lib/shared';
import { cn } from '@/lib/utils';

/**
 * The site header, one component for the home page, the templates and the
 * docs, so the bar does not change shape between them.
 *
 * Two sides with two jobs. **Left is where you are:** the site name and the
 * sections (Docs, Templates, Gallery). The docs sidebar's collapse control is
 * at the foot of the sidebar (see docs-shell), not here. **Right is tools,**
 * and every one of them is the same pill: search, the theme panel, the star
 * count, and light / dark / system. One shape for every tool is what keeps the
 * right side from reading as a pile of differently styled controls.
 *
 * Fumadocs' own headers each lay these out differently and cannot be
 * rearranged from options, so both layouts take this through `nav.component`.
 */

const NAV = [
  { label: 'Docs', href: docsRoute },
  { label: 'Templates', href: templatesRoute },
  { label: 'Gallery', href: gallery.url, external: true },
] as const;

const pill =
  'inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-fd-secondary text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4';
const iconPill = cn(pill, 'w-9');

export function SiteHeader({ docs = false }: { docs?: boolean }) {
  return (
    <header
      // The docs grid places its header by area, and Fumadocs' own styles look
      // for this id; the home layout simply stacks it.
      id={docs ? 'nd-subnav' : undefined}
      className={cn(
        'sticky top-0 z-40 h-14 border-b border-fd-border bg-fd-background/80 backdrop-blur-lg',
        // The whole first row, margins included: Fumadocs' `header` area
        // stops at the centred columns, and on a wide screen the bar would
        // end short of both edges.
        // `contain: inline-size` keeps the bar's own width out of the grid's
        // sums: spanning the flexible margin columns, its content width was
        // being added to them, and on a phone squeezed the article to a strip.
        docs && '[grid-area:1/1/2/-1] [contain:inline-size]',
      )}
    >
      {/* The bar runs edge to edge; what is on it keeps to the content's
          width — the docs grid's or the home page's — so the name sits over
          the sidebar and the last pill over the right edge of the content. */}
      <div className="mx-auto flex h-full w-full max-w-[var(--fd-layout-width,97rem)] items-center gap-3 px-4">
      <div className="flex min-w-0 items-center gap-1">
        <Link href="/" className="mr-3 inline-flex items-center gap-2.5 font-semibold">
          <Brand />
        </Link>
        <Sections className="max-md:hidden" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <SearchPill />
        {docs ? <DocsThemePill /> : <ThemePill />}
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(pill, 'px-3.5 max-md:hidden')}
        >
          <GitHubStars />
        </a>
        <ThemeSwitch
          mode="light-dark-system"
          className="h-9 gap-0.5 border-0 bg-fd-secondary p-1 max-md:hidden [&>button]:size-7"
        />
        {docs ? (
          <SidebarTrigger aria-label="Open sidebar" className={cn(iconPill, 'md:hidden')}>
            <PanelLeft />
          </SidebarTrigger>
        ) : (
          <HomeMenu className="md:hidden" />
        )}
      </div>
      </div>
    </header>
  );
}

function Sections({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn('flex items-center gap-1', className)}>
      {NAV.map((item) => {
        const external = 'external' in item;
        const active = !external && (pathname === item.href || pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.label}
            href={item.href}
            {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
            data-active={active}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-fd-muted-foreground transition-colors hover:text-fd-foreground data-[active=true]:font-medium data-[active=true]:text-fd-foreground"
          >
            {item.label}
            {external && <ArrowUpRight className="size-3.5 opacity-60" />}
          </Link>
        );
      })}
    </nav>
  );
}

function SearchPill() {
  const { setOpenSearch, enabled } = useSearchContext();
  if (!enabled) return null;
  return (
    <button
      type="button"
      aria-label="Search"
      title="Search  ⌘K"
      onClick={() => setOpenSearch(true)}
      className={iconPill}
    >
      <Search />
    </button>
  );
}

function ThemePill({ onToggle }: { onToggle?: () => void }) {
  const { open, setOpen } = useThemePanel();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label="Theme"
      onClick={() => {
        onToggle?.();
        setOpen(!open);
      }}
      className={cn(
        pill,
        'px-3.5 text-sm font-medium max-md:w-9 max-md:px-0',
        open && 'bg-fd-foreground text-fd-background hover:bg-fd-foreground hover:text-fd-background',
      )}
    >
      <PaintBucket />
      <span className="max-md:hidden">Theme</span>
    </button>
  );
}

/**
 * In the docs the theme pill also shuts the sidebar: on a phone the sidebar is
 * a sheet over the page, and it would sit over the panel. Only the docs layout
 * has that sidebar, so the hook lives in its own component.
 */
function DocsThemePill() {
  const sidebar = useSidebar();
  return <ThemePill onToggle={() => sidebar.setOpen(false)} />;
}

/**
 * The sections, the star count and the light / dark switch, folded into one
 * menu on a phone, where the header has room for three pills at most.
 */
function HomeMenu({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  React.useEffect(() => setOpen(false), [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={cn('relative', className)}>
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={iconPill}
      >
        <Menu />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 flex w-56 flex-col gap-1 rounded-xl border border-fd-border bg-fd-popover p-2 shadow-lg">
          <Sections className="flex-col items-stretch" />
          <div className="mt-1 flex items-center justify-between border-t border-fd-border pt-2">
            <a href={repoUrl} target="_blank" rel="noreferrer noopener" className={cn(pill, 'px-3.5')}>
              <GitHubStars />
            </a>
            <ThemeSwitch
              mode="light-dark-system"
              className="h-9 gap-0.5 border-0 bg-fd-secondary p-1 [&>button]:size-7"
            />
          </div>
        </div>
      )}
    </div>
  );
}
