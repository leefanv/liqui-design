'use client';

import * as React from 'react';
import Link from 'next/link';
import { LiquiGlass } from '@liqui-design/glass';
import { ArrowLeft, ArrowUpRight, Check, Copy } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * The strip that says "this is a demo, here is how to get it".
 *
 * It is glass, which is not decoration: the chrome floats over whatever the
 * template is doing underneath, and a solid bar would sit on the page like a
 * sticker. It is also the one piece here that is *not* part of the block —
 * nobody installing a media player wants a "back to liqui.design" link welded
 * into it — so it lives in the docs app and the route composes the two.
 */
export function TemplateChrome({
  title,
  command,
  sourceUrl,
}: {
  title: string;
  command: string;
  sourceUrl: string;
}) {
  return (
    <div className="dark pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center p-3 sm:justify-end sm:p-4">
      <LiquiGlass
        elevated
        radius={18}
        refraction={70}
        bezel={16}
        className="pointer-events-auto max-w-[calc(100vw-1.5rem)]"
        contentClassName="flex items-center gap-1 rounded-[inherit] p-1.5 text-[var(--lq-text)]"
      >
        <Link
          href="/templates"
          className={cn(itemClass, 'gap-1.5')}
          aria-label="Back to all templates"
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Templates</span>
        </Link>

        <span className="hidden h-4 w-px bg-[var(--lq-rim-lo)] md:block" />
        <span className="hidden px-1.5 text-[12px] font-semibold md:inline">{title}</span>

        <span className="h-4 w-px bg-[var(--lq-rim-lo)]" />
        <CopyCommand command={command} />

        <a href={sourceUrl} target="_blank" rel="noreferrer" className={cn(itemClass, 'gap-1')}>
          Source
          <ArrowUpRight className="size-3 opacity-60" />
        </a>
      </LiquiGlass>
    </div>
  );
}

const itemClass =
  'inline-flex cursor-default items-center rounded-[12px] px-2.5 py-1.5 text-[12px] font-medium ' +
  'no-underline outline-none transition-[background-color] duration-150 ' +
  'hover:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)] ' +
  'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]';

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false);

  // One timer, cleared on unmount and restarted on every click, so a second
  // click mid-countdown extends the tick rather than letting the first timer
  // reset the label while the second is still running.
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(command);
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 2000);
      }}
      aria-label={`Copy install command: ${command}`}
      className={cn(itemClass, 'gap-1.5 border-none bg-transparent font-[inherit] text-[var(--lq-text)]')}
    >
      {copied ? (
        <Check className="size-3.5 text-[var(--lq-accent)]" />
      ) : (
        <Copy className="size-3.5" />
      )}
      <span className="hidden lg:inline">{copied ? 'Copied' : 'Install'}</span>
    </button>
  );
}
