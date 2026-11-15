'use client';

import * as React from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import {
  defaultGlassTheme,
  FINISH_LIGHTING,
  prismGlassTheme,
  type GlassFinish,
  type GlassLighting,
  type GlassMaterial,
  type GlassProfile,
  type LiquiGlassProps,
  type LiquiGlassTheme,
} from '@liqui-design/glass';

import { cn } from '@/lib/utils';
import { Button } from '@/registry/liqui/ui/button';
import { Fieldset, FieldsetLegend } from '@/registry/liqui/ui/fieldset';
import { Separator } from '@/registry/liqui/ui/separator';
import {
  Slider,
  SliderControl,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValue,
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
 * **It is built out of the registry, at full strength.** Groups are
 * [Fieldset](/docs/components/fieldset), dials are
 * [Slider](/docs/components/slider) with their lens thumbs, pickers are
 * [Toggle Group](/docs/components/toggle-group) strips that refract, the
 * footer is [Button](/docs/components/button) and the rules are
 * [Separator](/docs/components/separator). None of them is turned down for
 * sitting on a panel: the panel is part of what is being tuned, so a host
 * puts it under the optics it sets (see `opticsToTheme`) and every control on
 * it changes with the dials — switch the finish and the panel you are
 * switching it on turns prism too.
 *
 * Colour comes from the liqui tokens throughout, so the same markup reads on
 * the playground's light chrome and on the home stage's night backdrops
 * without either host restyling it.
 */

export interface GlassOptics extends GlassLighting {
  material: GlassMaterial;
  profile: GlassProfile;
  finish: GlassFinish;
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
  finish: 'classic',
  refraction: 150,
  bezel: 28,
  dispersion: 0,
  specular: 0.7,
  frost: 0.35,
  blur: 1,
  ...FINISH_LIGHTING.classic,
};

/**
 * The dials each finish is drawn for. Picking a finish on the panel moves the
 * dials too: prism lighting on a classic 28px bezel reads as a bevelled
 * button, not as cut glass — it wants the narrow bezel, the stronger bend and
 * the bit of dispersion of the glass-type study it comes from. Same ratios as
 * `prismGlassTheme` in the kernel, written out in panel units.
 */
export const FINISH_OPTICS: Record<GlassFinish, Omit<GlassOptics, 'material' | 'profile'>> = {
  classic: {
    finish: 'classic',
    refraction: DEFAULT_OPTICS.refraction,
    bezel: DEFAULT_OPTICS.bezel,
    dispersion: DEFAULT_OPTICS.dispersion,
    specular: DEFAULT_OPTICS.specular,
    frost: DEFAULT_OPTICS.frost,
    blur: DEFAULT_OPTICS.blur,
    ...FINISH_LIGHTING.classic,
  },
  prism: {
    finish: 'prism',
    refraction: 190,
    bezel: 15,
    dispersion: 0.15,
    specular: 1,
    frost: 0.06,
    blur: 0.5,
    ...FINISH_LIGHTING.prism,
  },
};

/**
 * The panel's numbers as a theme, so every component keeps its own tuning.
 *
 * The panel reads in the units of one reference surface — the defaults above,
 * a panel-sized pane — so its geometric dials become the theme's multipliers
 * against that surface: Strength 300 on a pane whose own is 150 doubles every
 * component's refraction, the tooltip's 35 included. Spreading the numbers onto
 * each component instead (`asGlassProps`) hands a tooltip a drawer's bezel.
 */
export function opticsToTheme(optics: GlassOptics): LiquiGlassTheme {
  const base = optics.finish === 'prism' ? prismGlassTheme : defaultGlassTheme;
  const { classic: ref } = FINISH_OPTICS;
  return {
    ...base,
    material: optics.material,
    profile: optics.profile,
    finish: optics.finish,
    frost: optics.frost,
    specular: optics.specular,
    dispersion: optics.dispersion,
    refractionScale: optics.refraction / ref.refraction,
    bezelScale: optics.bezel / ref.bezel,
    blurScale: optics.blur / ref.blur,
    lightAngle: optics.lightAngle,
    edgeShade: optics.edgeShade,
    hairline: optics.hairline,
    brightness: optics.brightness,
    tintFloor: optics.tintFloor,
  };
}

/**
 * The way back from a theme: the panel's reading of what the theme is
 * wearing, so a panel can open on the site's theme instead of on the shipped
 * one. The geometric dials come back in the reference surface's units —
 * `refractionScale: 1.25` reads as Strength 187.5 — which is what the
 * surfaces actually render at, multiplier included. A host spreading these
 * onto surfaces that are themselves under that theme hands them through
 * `withoutThemeScales` first, or the multiplier lands twice.
 */
export function opticsFromTheme(theme: LiquiGlassTheme): GlassOptics {
  const { classic: ref } = FINISH_OPTICS;
  const lighting = FINISH_LIGHTING[theme.finish];
  return {
    material: theme.material,
    profile: theme.profile,
    finish: theme.finish,
    refraction: ref.refraction * theme.refractionScale,
    bezel: ref.bezel * theme.bezelScale,
    blur: ref.blur * theme.blurScale,
    dispersion: theme.dispersion,
    specular: theme.specular,
    frost: theme.frost,
    lightAngle: theme.lightAngle ?? lighting.lightAngle,
    edgeShade: theme.edgeShade ?? lighting.edgeShade,
    hairline: theme.hairline ?? lighting.hairline,
    brightness: theme.brightness ?? lighting.brightness,
    tintFloor: theme.tintFloor ?? lighting.tintFloor,
  };
}

/**
 * Panel readings as own props for a surface under `theme`. LiquiGlass scales
 * its own geometry by the theme's multipliers, so a reading that already
 * includes them is divided back out — otherwise a 1.25× theme would bend the
 * stage at 1.56×. A zero multiplier zeroes the surface whatever is passed, so
 * the reading goes through untouched there.
 */
export function withoutThemeScales(optics: GlassOptics, theme: LiquiGlassTheme): GlassOptics {
  const unscale = (value: number, scale: number) => (scale > 0 ? value / scale : value);
  return {
    ...optics,
    refraction: unscale(optics.refraction, theme.refractionScale),
    bezel: unscale(optics.bezel, theme.bezelScale),
    blur: unscale(optics.blur, theme.blurScale),
  };
}

/** Everything here is a valid LiquiGlass prop, so the object spreads straight in. */
export function asGlassProps(optics: GlassOptics): Partial<LiquiGlassProps> {
  return optics;
}

const MATERIALS: { value: GlassMaterial; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'Refraction where supported, frost elsewhere' },
  { value: 'frost', label: 'Frost', hint: 'Blur and saturation only — cheap' },
  { value: 'clear', label: 'Clear', hint: 'Tint and rim, no backdrop filter — cheapest' },
];

const FINISHES: { value: GlassFinish; label: string; hint: string }[] = [
  { value: 'classic', label: 'Classic', hint: 'Lit from above and below, frosted' },
  { value: 'prism', label: 'Prism', hint: 'Key light top left, dark rim, hairline — clear cut glass' },
];

const PROFILES: { value: GlassProfile; label: string; hint: string }[] = [
  { value: 'squircle', label: 'Squircle', hint: 'Physical: a steep rim that flattens fast' },
  { value: 'convex', label: 'Convex', hint: 'Physical: a rounder dome' },
  { value: 'rim', label: 'Rim', hint: 'Stylized falloff, kept for comparison' },
];

type DialKey = keyof Omit<GlassOptics, 'material' | 'profile' | 'finish'>;

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
  {
    // Every finish has a value for each of these; picking a finish loads its
    // own (FINISH_LIGHTING), and the dials take it from there.
    title: 'Lighting',
    dials: [
      { key: 'lightAngle', label: 'Light angle', min: -90, max: 90, step: 1, unit: '°' },
      { key: 'edgeShade', label: 'Edge shade', min: 0, max: 1, step: 0.02 },
      { key: 'hairline', label: 'Hairline', min: 0, max: 1, step: 0.05 },
      { key: 'brightness', label: 'Brightness', min: 0.8, max: 1.5, step: 0.02 },
      { key: 'tintFloor', label: 'Tint floor', min: 0, max: 0.5, step: 0.01 },
    ],
  },
];

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

/** A run of controls under its legend — a Fieldset, so the name is announced. */
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
    <Fieldset className={className}>
      <FieldsetLegend>{title}</FieldsetLegend>
      {children}
    </Fieldset>
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
      glass={{ contentClassName: 'w-full' }}
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
          className="flex-1"
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
  className,
}: {
  value: GlassOptics;
  onChange: (next: GlassOptics) => void;
  className?: string;
}) {
  const set = <K extends keyof GlassOptics>(key: K, next: GlassOptics[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <ControlGroup title="Material">
        <Segmented
          label="Finish"
          items={FINISHES}
          value={value.finish}
          onValueChange={(next) => onChange({ ...value, ...FINISH_OPTICS[next] })}
        />
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
              // and past the panel's edge.
              thumbAlignment="edge"
            >
              <div className="flex items-baseline justify-between gap-2">
                {/* `gap` rather than a margin on the hint: the playground's
                    reset is an unlayered `* { margin: 0 }`, which outranks every
                    layered utility no matter how specific. */}
                <SliderLabel className="flex items-baseline gap-1">
                  {dial.label}
                  {dial.hint && (
                    <em className="text-[11px] font-normal not-italic text-[var(--lq-text-dim)]">
                      {dial.hint}
                    </em>
                  )}
                </SliderLabel>
                {/* Formatted here rather than by Base UI: a unit, and a
                    step-matched number of decimals so the width never jitters. */}
                <SliderValue>
                  {(_, values) =>
                    `${values[0].toFixed(decimals(dial.step))}${dial.unit ?? ''}`
                  }
                </SliderValue>
              </div>
              <SliderControl>
                <SliderTrack>
                  <SliderThumb aria-label={dial.label} />
                </SliderTrack>
              </SliderControl>
            </Slider>
          ))}
        </ControlGroup>
      ))}

    </div>
  );
}

/**
 * Shuffle and Reset, as the panel's footer.
 *
 * Its own export rather than the last row of the dials, so a host can pin it
 * under the scroll area: the two actions that act on *every* dial should not
 * scroll away with the dials. Mirrors the title bar — a hairline on the
 * scrolling side, the same inset — so the panel reads as a window with a top
 * and a bottom rather than a list that happens to end.
 *
 * The buttons are the registry's [Button](/docs/components/button), glass
 * variant, at full strength like everything else on the panel.
 */
export function PanelActions({
  onShuffle,
  onReset,
  dirty = true,
  className,
}: {
  onShuffle?: () => void;
  onReset: () => void;
  /** Whether Reset has anything to undo. Without it Reset is always live. */
  dirty?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col',
        className,
      )}
    >
      <Separator />
      <div className="flex gap-2 px-4 py-3">
      {onShuffle && (
        <Button onClick={onShuffle} className={PANEL_BUTTON}>
          <Shuffle className="size-3.5" strokeWidth={2.2} />
          Shuffle
        </Button>
      )}
      <Button
        onClick={onReset}
        disabled={!dirty}
        title="Back to the theme"
        className={PANEL_BUTTON}
      >
        <RotateCcw className="size-3.5" strokeWidth={2.2} />
        Reset
      </Button>
      </div>
    </div>
  );
}

/**
 * Two buttons sharing the footer evenly. The surface is the flex item; its
 * content is sized to the label, so the surface centres it.
 */
const PANEL_BUTTON = 'flex-1 justify-center';
