'use client';

import * as React from 'react';

import { Input } from '@/registry/liqui/ui/input';

/**
 * `start` and `end` put content in the *same* content layer as the input, so a
 * glyph or a unit is drawn on the surface rather than on a surface of its own.
 * A second lens in there would have nothing behind it but this one's tint —
 * which is why a toggle inside a toggle group goes flat too.
 */
const SearchIcon = (
  <svg viewBox="0 0 14 14" width="13" height="13" fill="none" aria-hidden>
    <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.6" />
    <path d="M9.2 9.2 12.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export default function InputSlots() {
  const [query, setQuery] = React.useState('');

  return (
    <div className="flex w-72 flex-col gap-3">
      <Input
        aria-label="Search"
        placeholder="Search components"
        start={SearchIcon}
        value={query}
        onValueChange={setQuery}
        end={
          query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="cursor-default rounded-full px-1 text-[11px] font-semibold tracking-[0.04em] text-[var(--lq-text-dim)] uppercase outline-none hover:text-[var(--lq-text)] focus-visible:text-[var(--lq-text)]"
            >
              Clear
            </button>
          ) : null
        }
      />

      <Input
        aria-label="Bezel"
        type="number"
        defaultValue={26}
        end={<span className="text-[12px] tabular-nums">px</span>}
      />
    </div>
  );
}
