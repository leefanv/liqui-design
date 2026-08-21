import { appName, gallery } from '@/lib/shared';

/**
 * The site footer, shared by the home page and the templates index.
 *
 * Lifted out of `(home)/layout.tsx` when templates got their own route tree.
 * Full-screen template pages deliberately do not render it — they are the page
 * being demonstrated, and chrome around it would be someone else's design
 * competing with the one on show.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-fd-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {appName} — a{' '}
          <a
            href={gallery.url}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-fd-border underline-offset-4 transition hover:decoration-current"
          >
            {gallery.name}
          </a>{' '}
          project
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <FooterLink href={gallery.url}>Gallery</FooterLink>
          <FooterLink href={gallery.resources}>Resources</FooterLink>
          <FooterLink href={gallery.guide}>Guide</FooterLink>
        </nav>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="transition hover:text-fd-foreground">
      {children}
    </a>
  );
}
