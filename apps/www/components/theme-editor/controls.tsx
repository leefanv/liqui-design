'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The editor's own chrome.
 *
 * Pointedly *not* glass, and coloured with the docs palette rather than the
 * `--lq-*` tokens. A control panel that restyles itself as you drag it is a
 * toy: turn frost to 1 and radius to 2.5× and a glass panel stops being a
 * usable instrument at exactly the moment you need it to keep reading. The
 * preview beside it is where the theme is allowed to land.
 *
 * (This is why it does not reuse `glass-controls.tsx`, which is the optics
 * panel for a single surface and lives *on* glass in the home stage.)
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
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[11px] font-semibold tracking-[0.1em] text-fd-muted-foreground uppercase">
          {title}
        </h3>
        {action}
      </header>
      {hint && <p className="mb-3 text-[11.5px] text-fd-muted-foreground">{hint}</p>}
      <div className="flex flex-col gap-3">{children}</div>
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
          {hint && <em className="ml-1.5 text-[11px] not-italic opacity-55">{hint}</em>}
        </span>
        {value && <span className="tabular-nums text-fd-muted-foreground">{value}</span>}
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
 * canvas. A pointer drag fires `input` far more often than the compositor draws,
 * so without this the browser spends the drag rendering canvases for values
 * nobody ever saw. The thumb still tracks the pointer exactly — local state
 * moves immediately, only the commit waits for the frame.
 */
export function Slider({
  id,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id?: string;
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

  return (
    <input
      id={id}
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
      className="h-4 w-full accent-fd-primary"
    />
  );
}

/**
 * Colour input paired with the hex it holds, editable as text — a picker alone
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
        id={id}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="size-8 shrink-0 cursor-pointer rounded-md border border-fd-border bg-transparent p-0.5"
        aria-label="Colour"
      />
      <input
        type="text"
        value={text}
        onChange={(event) => commitText(event.target.value)}
        onBlur={() => setText(value)}
        spellCheck={false}
        className="w-full rounded-md border border-fd-border bg-fd-muted px-2 py-1.5 font-mono text-[12px] text-fd-foreground"
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
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="w-full rounded-md border border-fd-border bg-fd-muted px-2 py-1.5 text-[12px] text-fd-foreground"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
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
    <div
      role="group"
      aria-label={label}
      className="flex gap-0.5 rounded-lg border border-fd-border bg-fd-muted p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded-[5px] px-2 py-1 text-[12px] transition',
            value === option.value
              ? 'bg-fd-card text-fd-foreground shadow-sm'
              : 'text-fd-muted-foreground hover:text-fd-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ActionButton({
  onClick,
  children,
  variant = 'default',
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-40',
        variant === 'primary'
          ? 'bg-fd-primary text-fd-primary-foreground hover:opacity-90'
          : 'border border-fd-border text-fd-foreground hover:bg-fd-muted',
      )}
    >
      {children}
    </button>
  );
}

/** Copy-to-clipboard with the usual two-second acknowledgement. */
export function CopyButton({
  text,
  label = 'Copy',
  onCopied,
}: {
  text: string;
  label?: string;
  /** Fires only on a write the clipboard actually accepted. */
  onCopied?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <ActionButton
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => {
            setCopied(true);
            onCopied?.();
          },
          // Clipboard writes are refused without a user gesture or permission.
          // Failing quietly is wrong (nothing happened, and the label would say
          // it did) but throwing into the console is not the user's problem.
          () => setCopied(false),
        );
      }}
    >
      {copied ? 'Copied' : label}
    </ActionButton>
  );
}
