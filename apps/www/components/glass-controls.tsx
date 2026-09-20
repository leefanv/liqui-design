'use client';

import type { GlassMaterial, GlassProfile, LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/liqui/ui/select';
import {
  Slider,
  SliderControl,
  SliderLabel,
  SliderThumb,
  SliderTrack,
} from '@/registry/liqui/ui/slider';

/**
 * The optics panel, shared by the home stage and the playground.
 *
 * One implementation on purpose. Two panels drifted apart within a day of
 * existing — the home page ended up with a dial the playground lacked and
 * missing four the playground had — and explaining that difference costs more
 * than keeping them the same. It is also where "export this configuration as
 * code" will go, and that should be one change rather than two.
 *
 * **It is built out of the registry.** The dials used to be `<input
 * type="range">` and `<select>` with `accent-color` pointed at `--lq-accent`,
 * which put Chrome's own blue slider on the front page of a design library —
 * next to the components that library ships. Now the sliders are
 * [Slider](/docs/components/slider) and the pickers are
 * [Select](/docs/components/select), so the control that tunes the material is
 * made of the material.
 *
 * **It assumes it is on a glass panel**, because both hosts put it on one, and
 * that assumption is what the two opt-outs below are: a `backdrop-filter`
 * nested inside another one samples its parent's output rather than the page,
 * so a lens here would bend the panel it is lying on. The slider thumbs drop
 * their lens and the select triggers go `clear` — the rule written out on
 * [Scroll Area](/docs/components/scroll-area) and
 * [Popover](/docs/components/popover). The select *popups* keep their glass:
 * they portal to the body, so what is behind them really is the page.
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

const MATERIALS: { value: GlassMaterial; label: string }[] = [
  { value: 'auto', label: 'Auto (refract → frost)' },
  { value: 'frost', label: 'Frost (cheap)' },
  { value: 'clear', label: 'Clear (cheapest)' },
];

const PROFILES: { value: GlassProfile; label: string }[] = [
  { value: 'squircle', label: 'Squircle (physical)' },
  { value: 'convex', label: 'Convex (physical)' },
  { value: 'rim', label: 'Rim (stylized)' },
];

const DIALS: {
  key: keyof Omit<GlassOptics, 'material' | 'profile'>;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint?: string;
}[] = [
  { key: 'refraction', label: 'Refraction', min: 0, max: 260, step: 1, unit: 'px' },
  { key: 'bezel', label: 'Bezel', min: 4, max: 48, step: 1, unit: 'px' },
  { key: 'frost', label: 'Frost', min: 0, max: 1, step: 0.01 },
  { key: 'blur', label: 'Blur', min: 0, max: 12, step: 0.5, unit: 'px' },
  { key: 'specular', label: 'Specular', min: 0, max: 1, step: 0.05 },
  // Dispersion costs roughly three times the filter work, so it is worth saying
  // so at the point where someone is about to raise it.
  { key: 'dispersion', label: 'Dispersion', min: 0, max: 1, step: 0.05, hint: '3× cost' },
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
    <div className={cn('flex flex-col gap-3.5', className)}>
      <Picker
        label="Material"
        items={MATERIALS}
        value={value.material}
        onValueChange={(next) => set('material', next)}
      />
      <Picker
        label="Profile"
        items={PROFILES}
        value={value.profile}
        onValueChange={(next) => set('profile', next)}
      />

      {DIALS.map((dial) => (
        <Slider
          key={dial.key}
          min={dial.min}
          max={dial.max}
          step={dial.step}
          value={value[dial.key]}
          // Single-thumb sliders hand back a number; the array form is the
          // range case, which no dial here is.
          onValueChange={(next) => set(dial.key, Array.isArray(next) ? next[0] : next)}
        >
          <div className="flex items-baseline justify-between gap-2">
            {/* `gap` rather than a margin on the hint: the playground's reset
                is an unlayered `* { margin: 0 }`, which outranks every layered
                utility no matter how specific, so an `ml-1` here renders in the
                docs and silently does nothing there. */}
            <SliderLabel className="flex items-baseline gap-1">
              {dial.label}
              {dial.hint && (
                <em className="font-normal not-italic text-[var(--lq-text-dim)]">
                  ({dial.hint})
                </em>
              )}
            </SliderLabel>
            {/* Not `SliderValue`: these carry units and a step-matched number of
                decimals, and Base UI formats from the raw value. */}
            <span className="text-[12.5px] tabular-nums text-[var(--lq-text-dim)]">
              {value[dial.key]}
              {dial.unit}
            </span>
          </div>
          <SliderControl>
            <SliderTrack>
              <SliderThumb lens={false} />
            </SliderTrack>
          </SliderControl>
        </Slider>
      ))}

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className={cn(
            // A wash on glass that is already there, not a surface of its own —
            // the same call the dialog's dismiss makes.
            'w-full cursor-default rounded-[10px] border-none bg-transparent py-1.5',
            'font-semibold text-[var(--lq-text-dim)]',
            'outline-none transition-[background-color,color] duration-150',
            'hover:bg-[color-mix(in_srgb,var(--lq-highlight)_45%,transparent)] hover:text-[var(--lq-text)]',
            'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
            // After the font size, not before: tailwind-merge drops an earlier
            // `leading-*` when a later `text-{size}` could have carried one.
            'text-[12.5px] leading-tight',
          )}
        >
          Reset
        </button>
      )}
    </div>
  );
}

/**
 * Label above, select below. Two rows rather than one because the panel is
 * 240px wide and "Auto (refract → frost)" beside a label is an ellipsis.
 */
function Picker<T extends string>({
  label,
  items,
  value,
  onValueChange,
}: {
  label: string;
  items: { value: T; label: string }[];
  value: T;
  onValueChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-[var(--lq-text)]">{label}</span>
      <Select
        items={items}
        value={value}
        onValueChange={(next) => onValueChange(next as T)}
      >
        {/* `min-w-0`: the trigger ships a 180px floor for a form field, which is
            wider than this panel's content box once it has padding. */}
        <SelectTrigger glass={ON_PANEL} className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
