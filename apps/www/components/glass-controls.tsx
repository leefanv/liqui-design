'use client';

import * as React from 'react';
import type { GlassMaterial, GlassProfile, LiquiGlassProps } from '@liqui-design/glass';

/**
 * The optics panel, shared by the home stage and the playground.
 *
 * One implementation on purpose. Two panels drifted apart within a day of
 * existing — the home page ended up with a dial the playground lacked and
 * missing four the playground had — and explaining that difference costs more
 * than keeping them the same. It is also where "export this configuration as
 * code" will go, and that should be one change rather than two.
 *
 * Coloured with the liqui tokens rather than fixed values, so the same markup
 * reads correctly on the playground's light chrome and on the home page's dark
 * stage without either host restyling it.
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

const DIALS: {
  key: keyof Omit<GlassOptics, 'material' | 'profile'>;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}[] = [
  { key: 'refraction', label: 'Refraction', min: 0, max: 260, step: 1, unit: 'px' },
  { key: 'bezel', label: 'Bezel', min: 4, max: 48, step: 1, unit: 'px' },
  { key: 'frost', label: 'Frost', min: 0, max: 1, step: 0.01 },
  { key: 'blur', label: 'Blur', min: 0, max: 12, step: 0.5, unit: 'px' },
  { key: 'specular', label: 'Specular', min: 0, max: 1, step: 0.05 },
  { key: 'dispersion', label: 'Dispersion', min: 0, max: 1, step: 0.05 },
];

export function GlassControls({
  value,
  onChange,
  onReset,
  className,
}: {
  value: GlassOptics;
  onChange: (next: GlassOptics) => void;
  onReset?: () => void;
  className?: string;
}) {
  const set = <K extends keyof GlassOptics>(key: K, next: GlassOptics[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className={className}>
      <Row label="Material">
        <select
          value={value.material}
          onChange={(e) => set('material', e.target.value as GlassMaterial)}
          className="w-full rounded-md border border-[color-mix(in_srgb,var(--lq-text)_18%,transparent)] bg-[color-mix(in_srgb,var(--lq-text)_8%,transparent)] px-2 py-1 text-[12px] text-[var(--lq-text)]"
        >
          <option value="auto">Auto (refract → frost)</option>
          <option value="frost">Frost (cheap)</option>
          <option value="clear">Clear (cheapest)</option>
        </select>
      </Row>

      <Row label="Profile">
        <select
          value={value.profile}
          onChange={(e) => set('profile', e.target.value as GlassProfile)}
          className="w-full rounded-md border border-[color-mix(in_srgb,var(--lq-text)_18%,transparent)] bg-[color-mix(in_srgb,var(--lq-text)_8%,transparent)] px-2 py-1 text-[12px] text-[var(--lq-text)]"
        >
          <option value="squircle">Squircle (physical)</option>
          <option value="convex">Convex (physical)</option>
          <option value="rim">Rim (stylized)</option>
        </select>
      </Row>

      {DIALS.map((dial) => (
        <Row
          key={dial.key}
          label={dial.label}
          value={`${value[dial.key]}${dial.unit ?? ''}`}
          // Dispersion costs roughly three times the filter work, so it is worth
          // saying so at the point where someone is about to raise it.
          hint={dial.key === 'dispersion' ? '3× cost' : undefined}
        >
          <input
            type="range"
            min={dial.min}
            max={dial.max}
            step={dial.step}
            value={value[dial.key]}
            onChange={(e) => set(dial.key, Number(e.target.value))}
            className="w-full accent-[var(--lq-accent)]"
          />
        </Row>
      ))}

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-1 w-full rounded-lg border border-[color-mix(in_srgb,var(--lq-text)_18%,transparent)] py-1 text-[11px] text-[var(--lq-text-dim)] transition hover:bg-[color-mix(in_srgb,var(--lq-text)_8%,transparent)]"
        >
          Reset
        </button>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-2 block text-[11px] text-[var(--lq-text)] last:mb-0">
      <span className="flex items-baseline justify-between gap-2">
        <span>
          {label}
          {hint && <em className="ml-1 not-italic text-[var(--lq-text-dim)]">({hint})</em>}
        </span>
        {value && <span className="tabular-nums text-[var(--lq-text-dim)]">{value}</span>}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}
