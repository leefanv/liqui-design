'use client';

import * as React from 'react';
import type { GlassMaterial, GlassProfile, LiquiTheme, LiquiTokens } from '@liqui-design/glass';
import { LIQUI_TOKENS } from '@liqui-design/glass';

import {
  ActionButton,
  CopyButton,
  Row,
  Section,
  SegmentedControl,
  Select,
  Slider,
  Swatch,
} from '@/components/theme-editor/controls';
import { useSiteTheme } from '@/components/theme-provider';
import {
  trackThemeExported,
  trackThemePresetApplied,
  type ThemeExportKind,
} from '@/lib/analytics';
import {
  applyPatch,
  COLOR_KNOBS,
  encodeTheme,
  exportCss,
  exportProvider,
  GLASS_ABSOLUTE,
  GLASS_SCALES,
  isDefaultTheme,
  PRESETS,
  toDarkVariant,
  toLightVariant,
  type ColorKnob,
  type ColorMode,
  type RangeKnob,
} from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * The dials. Everything they touch is already live everywhere — the theme lives
 * at the root provider, so the docs behind this page are wearing it too.
 */
export function ThemeEditorPanel({
  mode,
  onModeChange,
}: {
  mode: ColorMode;
  onModeChange: (next: ColorMode) => void;
}) {
  const { theme, setTheme, reset } = useSiteTheme();
  const [linkModes, setLinkModes] = React.useState(true);
  const [advanced, setAdvanced] = React.useState(false);

  const tokens = theme[mode];

  const patchTokens = (target: ColorMode, patch: Partial<LiquiTokens>, base = theme): LiquiTheme => ({
    ...base,
    [target]: { ...base[target], ...patch },
  });

  const setColor = (knob: ColorKnob, value: string) => {
    let next = patchTokens(mode, knob.write(tokens, value, mode));
    if (knob.linked && linkModes) {
      // The brand colours are one colour seen under two lightings. Editing one
      // mode and leaving the other on the shipped blue is never what someone
      // picking a brand colour meant, and it is not visible from here — the
      // other mode is off screen.
      const other: ColorMode = mode === 'light' ? 'dark' : 'light';
      const derived = mode === 'light' ? toDarkVariant(value) : toLightVariant(value);
      next = patchTokens(other, knob.write(next[other], derived, other), next);
    }
    setTheme(next);
  };

  const setRange = (knob: RangeKnob, value: number) =>
    setTheme(patchTokens(mode, knob.write(tokens, value, mode)));

  const setGlass = (key: string, value: number | string) =>
    setTheme({ ...theme, glass: { ...theme.glass, [key]: value } });

  const css = exportCss(theme);
  const provider = exportProvider(theme);
  const untouched = isDefaultTheme(theme);

  return (
    <div className="flex flex-col rounded-xl border border-fd-border bg-fd-card">
      <Section title="Presets">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.description}
              onClick={() => {
                setTheme(applyPatch(preset.patch));
                trackThemePresetApplied(preset.id);
              }}
              className="flex items-center gap-2 rounded-lg border border-fd-border px-2 py-1.5 text-left text-[12px] text-fd-foreground transition hover:bg-fd-muted"
            >
              <span className="flex shrink-0 overflow-hidden rounded-full border border-fd-border">
                {preset.swatch.map((color) => (
                  <span key={color} className="size-2.5" style={{ background: color }} />
                ))}
              </span>
              {preset.name}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Colour"
        action={
          <SegmentedControl
            label="Which token set to edit"
            value={mode}
            onChange={onModeChange}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        }
      >
        {COLOR_KNOBS.map((knob) =>
          knob.kind === 'color' ? (
            <Row key={knob.id} label={knob.label} hint={knob.hint} htmlFor={`knob-${knob.id}`}>
              <Swatch
                id={`knob-${knob.id}`}
                value={knob.read(tokens)}
                onChange={(value) => setColor(knob, value)}
              />
            </Row>
          ) : (
            <Row
              key={knob.id}
              label={knob.label}
              hint={knob.hint}
              htmlFor={`knob-${knob.id}`}
              value={(knob.format ?? String)(knob.read(tokens, mode))}
            >
              <Slider
                id={`knob-${knob.id}`}
                min={knob.min}
                max={knob.max}
                step={knob.step}
                value={knob.read(tokens, mode)}
                onChange={(value) => setRange(knob, value)}
              />
            </Row>
          ),
        )}

        <label className="mt-1 flex items-center gap-2 text-[11.5px] text-fd-muted-foreground">
          <input
            type="checkbox"
            checked={linkModes}
            onChange={(event) => setLinkModes(event.target.checked)}
            className="accent-fd-primary"
          />
          Derive the other mode&rsquo;s accent and danger
        </label>
      </Section>

      <Section
        title="Tokens"
        hint="Every themeable custom property, as CSS. Anything valid here is valid there."
        action={
          <button
            type="button"
            onClick={() => setAdvanced((open) => !open)}
            className="text-[11.5px] text-fd-muted-foreground hover:text-fd-foreground"
          >
            {advanced ? 'Hide' : 'Show'}
          </button>
        }
      >
        {advanced &&
          LIQUI_TOKENS.map((name) => (
            <Row key={name} label={`--lq-${name}`} htmlFor={`token-${name}`}>
              <input
                id={`token-${name}`}
                value={tokens[name]}
                spellCheck={false}
                onChange={(event) => setTheme(patchTokens(mode, { [name]: event.target.value }))}
                className="w-full rounded-md border border-fd-border bg-fd-muted px-2 py-1.5 font-mono text-[11.5px] text-fd-foreground"
              />
            </Row>
          ))}
      </Section>

      <Section
        title="Glass"
        hint="Defaults for the dials components leave alone. A component that sets one for itself keeps it."
      >
        <Row label="Material" htmlFor="glass-material">
          <Select<GlassMaterial>
            id="glass-material"
            value={theme.glass.material}
            onChange={(value) => setGlass('material', value)}
            options={[
              { value: 'auto', label: 'Auto — refract, frost elsewhere' },
              { value: 'frost', label: 'Frost — cheap' },
              { value: 'clear', label: 'Clear — cheapest' },
            ]}
          />
        </Row>
        <Row label="Profile" htmlFor="glass-profile">
          <Select<GlassProfile>
            id="glass-profile"
            value={theme.glass.profile}
            onChange={(value) => setGlass('profile', value)}
            options={[
              { value: 'squircle', label: 'Squircle — physical' },
              { value: 'convex', label: 'Convex — physical' },
              { value: 'rim', label: 'Rim — stylized' },
            ]}
          />
        </Row>
        {GLASS_ABSOLUTE.map((dial) => {
          const value = theme.glass[dial.key] as number;
          return (
            <Row
              key={dial.key}
              label={dial.label}
              hint={dial.hint}
              htmlFor={`glass-${dial.key}`}
              value={`${value}${dial.unit ?? ''}`}
            >
              <Slider
                id={`glass-${dial.key}`}
                min={dial.min}
                max={dial.max}
                step={dial.step}
                value={value}
                onChange={(next) => setGlass(dial.key, next)}
              />
            </Row>
          );
        })}
      </Section>

      <Section
        title="Geometry"
        hint="Multipliers, not values. A Button asks for an 11px bezel and a Drawer for 34px; these move both and keep them in proportion."
      >
        {GLASS_SCALES.map((dial) => {
          const value = theme.glass[dial.key] as number;
          return (
            <Row
              key={dial.key}
              label={dial.label}
              hint={dial.hint}
              htmlFor={`glass-${dial.key}`}
              value={`${value.toFixed(2)}${dial.unit ?? ''}`}
            >
              <Slider
                id={`glass-${dial.key}`}
                min={dial.min}
                max={dial.max}
                step={dial.step}
                value={value}
                onChange={(next) => setGlass(dial.key, next)}
              />
            </Row>
          );
        })}
      </Section>

      <Section title="Take it with you">
        <div className="flex flex-wrap gap-2">
          <CopyButton
            label="Copy link"
            onCopied={() => trackThemeExported('link')}
            text={
              typeof window === 'undefined'
                ? ''
                : `${window.location.origin}${window.location.pathname}?t=${encodeTheme(theme)}`
            }
          />
          <ActionButton onClick={reset} disabled={untouched}>
            Reset
          </ActionButton>
        </div>

        {untouched ? (
          <p className="text-[11.5px] text-fd-muted-foreground">
            Nothing changed yet — an untouched theme emits no CSS at all.
          </p>
        ) : (
          <>
            <Snippet
              title="globals.css"
              hint="Paste below your liqui import. Only what you changed is here."
              code={css}
              kind="css"
            />
            {provider && (
              <Snippet
                title="Optics"
                hint="Refraction runs in JavaScript, so this half is a provider rather than CSS."
                code={provider}
                language="tsx"
                kind="provider"
              />
            )}
          </>
        )}
      </Section>
    </div>
  );
}

function Snippet({
  title,
  hint,
  code,
  kind,
  language = 'css',
}: {
  title: string;
  hint: string;
  code: string;
  kind: ThemeExportKind;
  language?: string;
}) {
  if (!code) return null;
  return (
    <div className="rounded-lg border border-fd-border">
      <div className="flex items-center justify-between gap-2 border-b border-fd-border px-2.5 py-1.5">
        <span className="font-mono text-[11px] text-fd-muted-foreground">{title}</span>
        <CopyButton text={code} onCopied={() => trackThemeExported(kind)} />
      </div>
      <p className="px-2.5 pt-2 text-[11px] text-fd-muted-foreground">{hint}</p>
      {/* Only the horizontal axis scrolls. Capping the height would put a
          third scrollbar on the page for the sake of a block that is thirty
          lines at its longest; a `--lq-shadow` line, on the other hand, is
          wider than the panel and would otherwise push the page sideways. */}
      <pre
        className={cn(
          'overflow-x-auto px-2.5 py-2 font-mono text-[11px] leading-relaxed text-fd-foreground',
          language === 'tsx' && 'whitespace-pre',
        )}
      >
        {code}
      </pre>
    </div>
  );
}
