'use client';

import * as React from 'react';
import type {
  GlassFinish,
  GlassLighting,
  GlassMaterial,
  GlassProfile,
  LiquiTheme,
  LiquiTokens,
} from '@liqui-design/glass';
import { LIQUI_TOKENS } from '@liqui-design/glass';

import { Check, Download, RotateCcw } from 'lucide-react';

import {
  Checkbox,
  PlainButton,
  Row,
  Section,
  SegmentedControl,
  Select,
  Slider,
  Swatch,
  TextField,
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
  GLASS_LIGHTING,
  GLASS_SCALES,
  isDefaultTheme,
  PRESETS,
  resolveLighting,
  toDarkVariant,
  toLightVariant,
  withFinish,
  type ColorKnob,
  type ColorMode,
  type RangeKnob,
} from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * The dials. Everything they touch is already live everywhere — the theme lives
 * at the root provider, so whatever page is behind the panel is wearing it too.
 * Hosted twice: on /theme beside a fixed preview, and in the panel docked
 * beside any page. Reset and export are not in here but in
 * `ThemeEditorFooter`, so each host can pin them under its scroll.
 */
export function ThemeEditorPanel({
  mode,
  onModeChange,
}: {
  mode: ColorMode;
  onModeChange: (next: ColorMode) => void;
}) {
  const { theme, setTheme } = useSiteTheme();
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

  return (
    <div className="flex flex-col text-fd-foreground">
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
              className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-fd-border px-2.5 text-left text-[12px] text-fd-foreground transition-colors hover:bg-fd-accent"
            >
              <span className="flex shrink-0 overflow-hidden rounded-full ring-1 ring-fd-border">
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
                label={knob.label}
                min={knob.min}
                max={knob.max}
                step={knob.step}
                value={knob.read(tokens, mode)}
                onChange={(value) => setRange(knob, value)}
              />
            </Row>
          ),
        )}

        <Checkbox checked={linkModes} onChange={setLinkModes}>
          Derive the other mode&rsquo;s accent and danger
        </Checkbox>
      </Section>

      <Section
        title="Tokens"
        hint="Every themeable custom property, as CSS. Anything valid here is valid there."
        action={
          <PlainButton variant="ghost" className="h-6 px-2" onClick={() => setAdvanced((open) => !open)}>
            {advanced ? 'Hide' : 'Show'}
          </PlainButton>
        }
      >
        {advanced &&
          LIQUI_TOKENS.map((name) => (
            <Row key={name} label={`--lq-${name}`} htmlFor={`token-${name}`}>
              <TextField
                id={`token-${name}`}
                value={tokens[name]}
                spellCheck={false}
                onChange={(event) => setTheme(patchTokens(mode, { [name]: event.target.value }))}
                className="font-mono text-[11.5px]"
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
        <Row label="Finish" hint="how it is lit" htmlFor="glass-finish">
          <Select<GlassFinish>
            id="glass-finish"
            value={theme.glass.finish}
            onChange={(value) => setTheme({ ...theme, glass: withFinish(theme.glass, value) })}
            options={[
              { value: 'classic', label: 'Classic — lit top and bottom, frosted' },
              { value: 'prism', label: 'Prism — one key light, cut and clear' },
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
                label={dial.label}
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
        title="Lighting"
        hint="Each follows the finish until you move it. Switching the finish lets go of them all."
      >
        {GLASS_LIGHTING.map((dial) => {
          const value = resolveLighting(theme.glass, dial.key as keyof GlassLighting);
          return (
            <Row
              key={dial.key}
              label={dial.label}
              hint={dial.hint}
              htmlFor={`glass-${dial.key}`}
              value={`${dial.step >= 1 ? Math.round(value) : value.toFixed(2)}${dial.unit ?? ''}`}
            >
              <Slider
                id={`glass-${dial.key}`}
                label={dial.label}
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
                label={dial.label}
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

    </div>
  );
}

interface ExportItem {
  kind: ThemeExportKind | 'download';
  label: string;
  hint: string;
  run: () => Promise<void>;
}

/**
 * Reset and Export, pinned under the dials by whichever host shows them.
 *
 * Export is a short menu rather than code printed into the panel: the panel is
 * for tuning, and thirty lines of CSS under the last dial only pushed the dials
 * further from the page they were changing. Every item copies or saves exactly
 * what the old snippets showed — only what differs from the shipped theme.
 */
export function ThemeEditorFooter({ className }: { className?: string }) {
  const { theme, reset } = useSiteTheme();
  const untouched = isDefaultTheme(theme);
  const [open, setOpen] = React.useState(false);
  const [done, setDone] = React.useState<string | null>(null);
  const root = React.useRef<HTMLDivElement>(null);

  // Click outside or Escape closes the menu, the way a menu is expected to.
  React.useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  React.useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(null), 1600);
    return () => clearTimeout(timer);
  }, [done]);

  // Nothing to take away from an untouched theme; a menu left open over it
  // would offer empty files.
  React.useEffect(() => {
    if (untouched) setOpen(false);
  }, [untouched]);

  const css = exportCss(theme);
  const provider = exportProvider(theme);
  const copy = (text: string) => navigator.clipboard.writeText(text);

  const items: ExportItem[] = [
    { kind: 'css', label: 'Copy CSS', hint: 'globals.css, below your liqui import', run: () => copy(css) },
    ...(provider
      ? [
          {
            kind: 'provider' as const,
            label: 'Copy provider',
            hint: 'the optics, which run in JavaScript',
            run: () => copy(provider),
          },
        ]
      : []),
    {
      kind: 'link',
      label: 'Copy share link',
      hint: 'opens this site wearing the theme',
      run: () =>
        copy(`${window.location.origin}${window.location.pathname}?t=${encodeTheme(theme)}`),
    },
    {
      kind: 'download',
      label: 'Download theme.css',
      hint: 'the CSS as a file',
      run: async () => {
        const url = URL.createObjectURL(new Blob([css], { type: 'text/css' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'theme.css';
        link.click();
        URL.revokeObjectURL(url);
      },
    },
  ];

  return (
    <div
      ref={root}
      className={cn('relative flex gap-2 border-t border-fd-border bg-fd-background px-4 py-3', className)}
    >
      <PlainButton
        className="flex-1"
        onClick={reset}
        disabled={untouched}
        title={untouched ? 'Nothing changed yet' : 'Back to the shipped theme'}
      >
        <RotateCcw className="size-3.5" />
        Reset
      </PlainButton>
      <PlainButton
        variant="solid"
        className="flex-1"
        onClick={() => setOpen((value) => !value)}
        disabled={untouched}
        aria-haspopup="menu"
        aria-expanded={open}
        title={untouched ? 'Nothing changed yet — an untouched theme exports nothing' : undefined}
      >
        <Download className="size-3.5" />
        Export
      </PlainButton>

      {open && (
        <div
          role="menu"
          aria-label="Export"
          className="absolute right-4 bottom-full left-4 mb-2 rounded-lg border border-fd-border bg-fd-popover p-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.kind}
              type="button"
              role="menuitem"
              onClick={() => {
                item.run().then(
                  () => {
                    if (item.kind !== 'download') trackThemeExported(item.kind);
                    setDone(item.kind);
                  },
                  // A refused clipboard write: nothing happened, so nothing
                  // says it did.
                  () => {},
                );
              }}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-fd-accent"
            >
              <span className="flex flex-col">
                <span className="text-[12px] text-fd-popover-foreground">{item.label}</span>
                <span className="text-[11px] text-fd-muted-foreground">{item.hint}</span>
              </span>
              {done === item.kind && <Check className="size-3.5 shrink-0 text-fd-foreground" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
