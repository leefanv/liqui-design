'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * The editor's own chrome: a small, plain instrument set.
 *
 * Deliberately not the registry, and not glass. The panel is a solid column
 * beside the page, so refraction in it bends nothing and only adds cost — a
 * filter per control, and a map and a baked specular per control rebuilt each
 * time a dial moves the geometry or the light, which measured as most of what
 * a drag cost. These are native elements in the docs' own palette: hairline
 * borders, one ink colour, nothing that changes as the theme does. The page
 * beside the panel is the preview; the panel stays still and legible while
 * you tune it.
 *
 * The range and colour-well styling lives in global.css under `.te-*`, since
 * the parts it has to reach (`::-webkit-slider-thumb` and friends) are not
 * worth spelling out as utilities.
 */

export function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-fd-border px-4 py-4 first:border-t-0">
      <header className="mb-3 flex min-h-6 items-center justify-between gap-3">
        <h3 className="text-[11px] font-medium tracking-[0.08em] text-fd-muted-foreground uppercase">
          {title}
        </h3>
        {action}
      </header>
      {hint && <p className="-mt-1 mb-3 text-[11.5px] leading-snug text-fd-muted-foreground">{hint}</p>}
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}

export function Row({
  label,
  hint,
  value,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  value?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-baseline justify-between gap-2 text-[12px] text-fd-foreground"
      >
        <span>
          {label}
          {hint && <span className="ml-1.5 text-[11px] text-fd-muted-foreground">{hint}</span>}
        </span>
        {value && (
          <span className="font-mono text-[11px] tabular-nums text-fd-muted-foreground">{value}</span>
        )}
      </label>
      {children}
    </div>
  );
}

/**
 * A range input that reports at most once per frame.
 *
 * Every commit re-renders every glass surface on the page, and a changed
 * radius, refraction or bezel re-generates each one's displacement map on a
 * canvas. A drag fires `input` far more often than the compositor draws, so
 * without this the browser spends the drag rendering canvases for values
 * nobody ever saw. The thumb still tracks the pointer exactly — local state
 * moves immediately, only the commit waits for the frame.
 */
export function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id?: string;
  /** Accessible name; the visible label is the Row's. */
  label?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}) {
  const [local, setLocal] = React.useState(value);
  const frame = React.useRef(0);
  const pending = React.useRef<number | null>(null);
  const dragging = React.useRef(false);

  // A preset, a reset or a shared link changes the value from outside. Ignored
  // mid-drag, where the pointer is the authority and adopting an in-flight
  // committed value would make the thumb stutter backwards.
  React.useEffect(() => {
    if (!dragging.current) setLocal(value);
  }, [value]);

  React.useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const commit = (next: number) => {
    pending.current = next;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const queued = pending.current;
      pending.current = null;
      if (queued !== null) onChange(queued);
    });
  };

  const fill = max > min ? ((local - min) / (max - min)) * 100 : 0;

  return (
    <input
      id={id}
      aria-label={label}
      type="range"
      min={min}
      max={max}
      step={step}
      value={local}
      onPointerDown={() => {
        dragging.current = true;
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onChange={(event) => {
        const next = Number(event.target.value);
        setLocal(next);
        commit(next);
      }}
      className="te-range"
      style={{ '--te-fill': `${fill}%` } as React.CSSProperties}
    />
  );
}

const fieldClass =
  'h-8 w-full min-w-0 rounded-md border border-fd-border bg-transparent px-2.5 text-[12px] text-fd-foreground outline-none transition-colors hover:border-fd-muted-foreground/40 focus:border-fd-foreground';

export function TextField({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, className)} />;
}

/**
 * A colour well and the hex it holds, editable as text — a picker alone
 * cannot take a value from a brand document, and a text field alone cannot be
 * explored.
 */
export function Swatch({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [text, setText] = React.useState(value);

  React.useEffect(() => setText(value), [value]);

  const commitText = (next: string) => {
    setText(next);
    // Only a complete hex is a colour. Committing on every keystroke would send
    // `#2` — black — to the theme while someone is still typing.
    if (/^#[0-9a-f]{6}$/i.test(next.trim())) onChange(next.trim().toLowerCase());
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="te-well"
        aria-label="Pick a colour"
      />
      <TextField
        id={id}
        value={text}
        onChange={(event) => commitText(event.target.value)}
        onBlur={() => setText(value)}
        spellCheck={false}
        className="font-mono"
      />
    </div>
  );
}

export function Select<T extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(fieldClass, 'cursor-pointer appearance-none pr-8')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-fd-muted-foreground"
      />
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-fd-border p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-[4px] px-2.5 py-0.5 text-[11.5px] transition-colors',
            value === option.value
              ? 'bg-fd-foreground text-fd-background'
              : 'text-fd-muted-foreground hover:text-fd-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[12px] text-fd-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3.5 cursor-pointer accent-[var(--color-fd-foreground)]"
      />
      {children}
    </label>
  );
}

export function PlainButton({
  variant = 'outline',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'outline' | 'solid' | 'ghost' }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-[12px] font-medium whitespace-nowrap outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-fd-ring disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'outline' &&
          'border border-fd-border text-fd-foreground hover:not-disabled:bg-fd-accent',
        variant === 'solid' &&
          'bg-fd-foreground text-fd-background hover:not-disabled:opacity-85',
        variant === 'ghost' &&
          'text-fd-muted-foreground hover:not-disabled:bg-fd-accent hover:not-disabled:text-fd-foreground',
        className,
      )}
    />
  );
}
