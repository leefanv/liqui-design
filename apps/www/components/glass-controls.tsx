'use client';

import * as React from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import type { GlassMaterial, GlassProfile, LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';
import {
  Slider,
  SliderControl,
  SliderLabel,
  SliderThumb,
  SliderTrack,
} from '@/registry/liqui/ui/slider';
import { Toggle } from '@/registry/liqui/ui/toggle';
import { ToggleGroup } from '@/registry/liqui/ui/toggle-group';

/**
 * The optics panel, shared by the home stage and the playground.
 *
 * One implementation on purpose. Two panels drifted apart within a day of
 * existing — the home page ended up with a dial the playground lacked and
 * missing four the playground had — and explaining that difference costs more
 * than keeping them the same.
 *
 * **It is built out of the registry.** The dials are
 * [Slider](/docs/components/slider) and the pickers are
 * [Toggle Group](/docs/components/toggle-group), so the control that tunes the
 * material is made of the material. The look is an instrument panel rather
 * than a form: dials grouped under small capitals, the reading in a monospace
 * figure at the end of each row, and a hairline track with a small knob under
 * it. The slider gets there through its own geometry variables — the knob and
 * rail sizes it publishes on its root — so this is the shipped component at
 * another size, not a fork of it.
 *
 * **It assumes it is on a glass panel**, because both hosts put it on one, and
 * that assumption is what the two opt-outs below are: a `backdrop-filter`
 * nested inside another one samples its parent's output rather than the page,
 * so a lens here would bend the panel it is lying on. The slider thumbs drop
 * their lens and the toggle groups go `clear` — the rule written out on
 * [Scroll Area](/docs/components/scroll-area) and
 * [Popover](/docs/components/popover).
 *
 * Colour comes from the liqui tokens throughout, so the same markup reads on
 * the playground's light chrome and on the home stage's night backdrops
 * without either host restyling it.
 */

export interface GlassOptics {
  material: GlassMaterial;
  profile: GlassProfile;
  refraction: number;
  bezel: number;
  dispersion: number;
  specular: number;
  frost: number;
  blur: number;
}

export const DEFAULT_OPTICS: GlassOptics = {
  material: 'auto',
  profile: 'squircle',
  refraction: 150,
  bezel: 28,
  dispersion: 0,
  specular: 0.7,
  frost: 0.35,
  blur: 1,
};

/** Everything here is a valid LiquiGlass prop, so the object spreads straight in. */
export function asGlassProps(optics: GlassOptics): Partial<LiquiGlassProps> {
  return optics;
}

/** Tint and rim, no lens — see the note above on nesting. */
const ON_PANEL = { material: 'clear' } satisfies Partial<LiquiGlassProps>;

const MATERIALS: { value: GlassMaterial; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'Refraction where supported, frost elsewhere' },
  { value: 'frost', label: 'Frost', hint: 'Blur and saturation only — cheap' },
  { value: 'clear', label: 'Clear', hint: 'Tint and rim, no backdrop filter — cheapest' },
];

const PROFILES: { value: GlassProfile; label: string; hint: string }[] = [
  { value: 'squircle', label: 'Squircle', hint: 'Physical: a steep rim that flattens fast' },
  { value: 'convex', label: 'Convex', hint: 'Physical: a rounder dome' },
  { value: 'rim', label: 'Rim', hint: 'Stylized falloff, kept for comparison' },
];

type DialKey = keyof Omit<GlassOptics, 'material' | 'profile'>;

interface Dial {
  key: DialKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint?: string;
}

/**
 * Grouped the way the material is built: what the lens does to the backdrop,
 * then what the surface lays over it.
 */
const GROUPS: { title: string; dials: Dial[] }[] = [
  {
    title: 'Refraction',
    dials: [
      { key: 'refraction', label: 'Strength', min: 0, max: 260, step: 1, unit: 'px' },
      { key: 'bezel', label: 'Bezel', min: 4, max: 48, step: 1, unit: 'px' },
      // Dispersion costs roughly three times the filter work, so it is worth
      // saying so at the point where someone is about to raise it.
      { key: 'dispersion', label: 'Dispersion', min: 0, max: 1, step: 0.05, hint: '3× cost' },
    ],
  },
  {
    title: 'Surface',
    dials: [
      { key: 'frost', label: 'Frost', min: 0, max: 1, step: 0.01 },
      { key: 'blur', label: 'Blur', min: 0, max: 12, step: 0.5, unit: 'px' },
      { key: 'specular', label: 'Specular', min: 0, max: 1, step: 0.05 },
    ],
  },
];

/**
 * The slider's own geometry variables, at instrument size: a 4px rail and a
 * 28×18 knob. `--lq-knob-pad` is what keeps the knob from being clipped by the
 * control's box — half the difference between knob and rail.
 */
const FINE_SLIDER = {
  '--lq-rail-h': '4px',
  '--lq-knob-w': '28px',
  '--lq-knob-h': '18px',
  '--lq-knob-pad': '7px',
} as React.CSSProperties;

/** Fixed decimals per dial, read off its step, so a reading never jitters in width. */
const decimals = (step: number) => (Number.isInteger(step) ? 0 : String(step).split('.')[1].length);

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
const within = (dial: Dial, lo: number, hi: number) => {
  const span = dial.max - dial.min;
  const raw = dial.min + span * (lo + Math.random() * (hi - lo));
  return Number((Math.round(raw / dial.step) * dial.step).toFixed(decimals(dial.step)));
};

/**
 * A random look that still reads as glass. Each dial draws from the part of
 * its range that does — the full range of Strength includes 0, which is a tint,
 * and of Bezel includes 4, which is a hairline — and the material stays on
 * Auto, because shuffling into Clear would look like the button broke the
 * stage. Dispersion stays low for the same reason it carries a cost warning.
 */
export function shuffleOptics(base: GlassOptics): GlassOptics {
  const dial = (key: DialKey) => GROUPS.flatMap((g) => g.dials).find((d) => d.key === key)!;
  return {
    ...base,
    material: 'auto',
    profile: pick(['squircle', 'convex'] as const),
    refraction: within(dial('refraction'), 0.3, 0.85),
    bezel: within(dial('bezel'), 0.3, 0.8),
    dispersion: within(dial('dispersion'), 0, 0.35),
    frost: within(dial('frost'), 0.05, 0.7),
    blur: within(dial('blur'), 0, 0.25),
    specular: within(dial('specular'), 0.4, 1),
  };
}

export const sameOptics = (a: GlassOptics, b: GlassOptics) =>
  (Object.keys(a) as (keyof GlassOptics)[]).every((key) => a[key] === b[key]);

/* -------------------------------------------------------------------------- */
/* Building blocks, exported so a host can add a group in the same hand        */
/* -------------------------------------------------------------------------- */

/** A run of controls under a small-capitals heading. */
export function ControlGroup({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <h3 className="text-[10.5px] font-bold tracking-[0.06em] text-[var(--lq-text-dim)] uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * One-of-n picker in segmented form. A Toggle Group with exactly one value
 * held: pressing the active segment would otherwise leave nothing selected,
 * so an empty change is ignored.
 */
export function Segmented<T extends string>({
  label,
  items,
  value,
  onValueChange,
  className,
}: {
  label: string;
  items: readonly { value: T; label: string; hint?: string }[];
  value: T;
  onValueChange: (next: T) => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      glass={{ ...ON_PANEL, contentClassName: 'w-full' }}
      value={[value]}
      onValueChange={(next) => {
        if (next.length > 0) onValueChange(next[next.length - 1] as T);
      }}
      className={cn('w-full', className)}
    >
      {items.map((item) => (
        <Toggle
          key={item.value}
          value={item.value}
          title={item.hint}
          className="flex-1 px-1.5 py-[5px] text-[12px] font-semibold"
        >
          {item.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

/* -------------------------------------------------------------------------- */
/* Panel body                                                                  */
/* -------------------------------------------------------------------------- */

export function GlassControls({
  value,
  onChange,
  onReset,
  onShuffle,
  dirty = true,
  className,
}: {
  value: GlassOptics;
  onChange: (next: GlassOptics) => void;
  onReset?: () => void;
  /** Shown as a button beside Reset when given. */
  onShuffle?: () => void;
  /** Whether Reset has anything to undo. Without it Reset is always live. */
  dirty?: boolean;
  className?: string;
}) {
  const set = <K extends keyof GlassOptics>(key: K, next: GlassOptics[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <ControlGroup title="Material">
        <Segmented
          label="Material"
          items={MATERIALS}
          value={value.material}
          onValueChange={(next) => set('material', next)}
        />
        <Segmented
          label="Profile"
          items={PROFILES}
          value={value.profile}
          onValueChange={(next) => set('profile', next)}
        />
      </ControlGroup>

      {GROUPS.map((group) => (
        <ControlGroup key={group.title} title={group.title}>
          {group.dials.map((dial) => (
            <Slider
              key={dial.key}
              min={dial.min}
              max={dial.max}
              step={dial.step}
              value={value[dial.key]}
              // Single-thumb sliders hand back a number; the array form is the
              // range case, which no dial here is.
              onValueChange={(next) => set(dial.key, Array.isArray(next) ? next[0] : next)}
              // Edge, not centre: a knob centred on 0 hangs half off the rail
              // and past the labels' left edge, which on a panel this narrow
              // reads as a layout bug.
              thumbAlignment="edge"
              style={FINE_SLIDER}
              className="gap-1.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                {/* `gap` rather than a margin on the hint: the playground's
                    reset is an unlayered `* { margin: 0 }`, which outranks every
                    layered utility no matter how specific. */}
                <SliderLabel className="flex items-baseline gap-1 text-[12.5px] font-normal text-[color-mix(in_srgb,var(--lq-text)_78%,transparent)]">
                  {dial.label}
                  {dial.hint && (
                    <em className="text-[11px] font-normal not-italic text-[var(--lq-text-dim)]">
                      {dial.hint}
                    </em>
                  )}
                </SliderLabel>
                {/* Not `SliderValue`: these carry units and a step-matched
                    number of decimals, and Base UI formats from the raw value. */}
                <span className="font-mono text-[12px] text-[var(--lq-text)] tabular-nums">
                  {value[dial.key].toFixed(decimals(dial.step))}
                  {dial.unit && <span className="text-[var(--lq-text-dim)]">{dial.unit}</span>}
                </span>
              </div>
              <SliderControl>
                <SliderTrack>
                  <SliderThumb lens={false} aria-label={dial.label} />
                </SliderTrack>
              </SliderControl>
            </Slider>
          ))}
        </ControlGroup>
      ))}

      {(onShuffle || onReset) && (
        <div className="flex gap-2">
          {onShuffle && (
            <PanelButton onClick={onShuffle}>
              <Shuffle className="size-3.5" strokeWidth={2.2} />
              Shuffle
            </PanelButton>
          )}
          {onReset && (
            <PanelButton onClick={onReset} disabled={!dirty} title="Back to the defaults">
              <RotateCcw className="size-3.5" strokeWidth={2.2} />
              Reset
            </PanelButton>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A wash on glass that is already there, not a surface of its own — the same
 * call the dialog's dismiss makes. A hairline keeps it reading as a button on
 * a panel whose tint is already most of what a fill would be.
 */
function PanelButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex flex-1 cursor-default items-center justify-center gap-1.5 rounded-[11px] py-2',
        'border border-[color-mix(in_srgb,var(--lq-text)_14%,transparent)]',
        'bg-[color-mix(in_srgb,var(--lq-highlight)_30%,transparent)] font-semibold text-[var(--lq-text)]',
        'outline-none transition-[background-color,opacity,scale] duration-150 active:scale-[0.97]',
        'hover:not-disabled:bg-[color-mix(in_srgb,var(--lq-highlight)_60%,transparent)]',
        'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
        'disabled:opacity-45',
        // After the font size, not before: tailwind-merge drops an earlier
        // `leading-*` when a later `text-{size}` could have carried one.
        'text-[12.5px] leading-tight',
        className,
      )}
    />
  );
}
