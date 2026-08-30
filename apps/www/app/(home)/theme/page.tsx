import type { Metadata } from 'next';
import Link from 'next/link';

import { ThemeEditor } from '@/components/theme-editor/editor';

export const metadata: Metadata = {
  title: 'Theme',
  description:
    'Tune liqui globally — accent, tint, rim, shadow and the glass optics — and take the result away as CSS variables and a provider.',
};

export default function ThemePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Theme</h1>
        <p className="text-[13px] text-fd-muted-foreground">
          Applies to the whole site and is kept in this browser.
        </p>
        <Link
          href="/docs/handbook/theming"
          className="ml-auto text-[13px] text-fd-muted-foreground underline underline-offset-4 hover:text-fd-foreground"
        >
          How theming works
        </Link>
      </header>

      <ThemeEditor />
    </main>
  );
}
