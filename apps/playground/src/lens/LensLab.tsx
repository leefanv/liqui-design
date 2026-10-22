import * as React from 'react';
import {
  buildLensMaps,
  CONVEX,
  LensFilter,
  LIP,
  supportsRefraction,
  type LensMaps,
  type LensOptics,
  type LensSurface,
} from '@/lib/lens';
import { Slider, SliderControl, SliderThumb, SliderTrack } from '@registry/ui/slider';
import { Switch } from '@registry/ui/switch';
import { TabBar, TabBarItem } from '@registry/ui/tab-bar';

/**
 * Acceptance page for the lens dome (`curvature`) and fringe (`dispersion`).
 *
 * Two halves. The specimens freeze each control's lens in its *pressed* state —
 * the only state the lens is visible in, and one you cannot hold still while
 * also looking at it — and lay out the release before the change, the new
 * defaults and a free column side by side. The live half is the real
 * components with the same three settings, for the feel.
 *
 * The specimen geometry mirrors the constants inside switch.tsx, slider.tsx
 * and tab-bar.tsx. They are private to those files on purpose, so they are
 * repeated here rather than exported for a lab; if a control's numbers move,
 * move them here too.
 */

type Optics = Required<LensOptics>;
type ControlKey = 'switch' | 'slider' | 'tab';

const BEFORE: Optics = { curvature: 0, dispersion: 0 };

/** The defaults each control ships with on this branch. */
const DEFAULTS: Record<ControlKey, Optics> = {
  switch: { curvature: 0.3, dispersion: 0.15 },
  slider: { curvature: 0.4, dispersion: 0.04 },
  tab: { curvature: 0.2, dispersion: 0.12 },
};

interface Geometry {
  label: string;
  width: number;
  height: number;
  bezel: number;
  surface: LensSurface;
  /** Displacement scale while held: PEAK × PRESS_RATIO. */
  pressedScale: number;
  pressScale: number;
  /** White fill left over the lens while held. */
  pressFill: number;
  blur: number;
  specularOpacity: number;
  specularSaturation: number;
}

const SWITCH_K = 30 / 67;
const SWITCH_H = Math.round(92 * SWITCH_K);

const GEOMETRY: Record<ControlKey, Geometry> = {
  switch: {
    label: 'Switch thumb',
    width: Math.round(146 * SWITCH_K),
    height: SWITCH_H,
    bezel: 0.413 * (SWITCH_H / 2),
    surface: LIP,
    pressedScale: 0.3196 * SWITCH_H * 0.9,
    pressScale: 0.9,
    pressFill: 0.1,
    blur: 0.2 * SWITCH_K,
    specularOpacity: 0.5,
    specularSaturation: 6,
  },
  slider: {
    label: 'Slider thumb',
    width: Math.round(45 * 1.5),
    height: 45,
    bezel: 0.417 * 22.5,
    surface: CONVEX,
    pressedScale: 1.178 * 45 * 0.9,
    pressScale: 1,
    pressFill: 0.1,
    blur: 0,
    specularOpacity: 0.4,
    specularSaturation: 7,
  },
  tab: {
    label: 'Tab bar pill',
    width: 84,
    height: 46,
    bezel: 0.413 * 23,
    surface: LIP,
    pressedScale: 0.3196 * 46,
    pressScale: 1.16,
    pressFill: 0.08,
    blur: 0,
    specularOpacity: 0.42,
    specularSaturation: 5,
  },
};

type Backdrop = 'native' | 'grid' | 'text' | 'wallpaper';

const CELL_W = 176;
const CELL_H = 96;

/* -------------------------------------------------------------------------- */
/* Backdrops                                                                   */
/* -------------------------------------------------------------------------- */

const GRID_BG =
  'repeating-linear-gradient(0deg, transparent 0 7px, rgba(20,20,30,0.55) 7px 8px),' +
  'repeating-linear-gradient(90deg, transparent 0 7px, rgba(20,20,30,0.55) 7px 8px),' +
  'linear-gradient(90deg, #ff5a5f, #ffb400 25%, #3ccf8e 50%, #2f7bff 75%, #b35cff)';

function NativeBackdrop({ control }: { control: ControlKey }) {
  if (control === 'switch') {
    // The track, with the held thumb parked over its trailing end.
    return (
      <div className="absolute inset-0 grid place-items-center">
        <span
          className="block rounded-full bg-[color-mix(in_srgb,var(--lq-accent)_93%,transparent)]"
          style={{ width: 72, height: 30, translate: '-14px 0' }}
        />
      </div>
    );
  }
  if (control === 'slider') {
    // The rail, filled up to where the thumb is held.
    return (
      <div className="absolute inset-0 flex items-center px-6">
        <span className="relative block h-[14px] w-full rounded-full bg-[rgba(120,120,128,0.25)]">
          <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-[var(--lq-accent)]" />
        </span>
      </div>
    );
  }
  // A strip of the bar: the item under the pill and its neighbours.
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex h-[58px] items-center gap-6 rounded-full bg-[rgba(120,120,128,0.18)] px-6 text-[11px] font-semibold text-[var(--lq-text)]">
        {['Home', 'Explore', 'Saved'].map((label) => (
          <span key={label} className="flex flex-col items-center gap-0.5">
            <span className="block size-[18px] rounded-[5px] bg-current opacity-80" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function BackdropLayer({ kind, control }: { kind: Backdrop; control: ControlKey }) {
  if (kind === 'native') return <NativeBackdrop control={control} />;
  if (kind === 'grid') return <div className="absolute inset-0" style={{ background: GRID_BG }} />;
  if (kind === 'wallpaper') {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'var(--lab-wallpaper)' }}
      />
    );
  }
  return (
    <div className="absolute inset-0 overflow-hidden bg-white p-2 text-[11px] leading-[13px] text-[#1b1b22]">
      {Array.from({ length: 9 }, (_, i) => (
        <p key={i} className="whitespace-nowrap">
          <b className="text-[#2f7bff]">Liquid glass</b> refracts the live page —{' '}
          <span className="text-[#e5484d]">red</span> / <span className="text-[#30a46c]">green</span>{' '}
          / <span className="text-[#2f7bff]">blue</span> 0123456789
        </p>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Specimen                                                                    */
/* -------------------------------------------------------------------------- */

function Specimen({
  control,
  optics,
  backdrop,
  showMap,
}: {
  control: ControlKey;
  optics: Optics;
  backdrop: Backdrop;
  showMap: boolean;
}) {
  const g = GEOMETRY[control];
  const id = `lab-${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [maps, setMaps] = React.useState<LensMaps | null>(null);

  React.useEffect(() => {
    if (!supportsRefraction()) return;
    setMaps(
      buildLensMaps({
        width: g.width,
        height: g.height,
        radius: g.height / 2,
        bezel: g.bezel,
        surface: g.surface,
        curvature: optics.curvature,
        dpr: Math.min(window.devicePixelRatio || 1, 3),
      }),
    );
  }, [g, optics.curvature]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative overflow-hidden rounded-xl ring-1 ring-black/10"
        style={{ width: CELL_W, height: CELL_H }}
      >
        <BackdropLayer kind={backdrop} control={control} />
        {maps && (
          <LensFilter
            id={id}
            maps={maps}
            width={g.width}
            height={g.height}
            scale={g.pressedScale}
            blur={g.blur}
            specularOpacity={g.specularOpacity}
            specularSaturation={g.specularSaturation}
            dispersion={optics.dispersion}
          />
        )}
        <span
          aria-hidden
          className="absolute"
          style={{
            width: g.width,
            height: g.height,
            borderRadius: g.height / 2,
            left: (CELL_W - g.width) / 2,
            top: (CELL_H - g.height) / 2,
            scale: g.pressScale,
            backgroundColor:
              control === 'tab'
                ? `color-mix(in srgb, var(--lq-highlight) ${g.pressFill * 100}%, transparent)`
                : `rgba(255,255,255,${g.pressFill})`,
            boxShadow: '0 4px 22px rgba(0,0,0,0.1)',
            ...(maps ? { backdropFilter: `url(#${id})`, WebkitBackdropFilter: `url(#${id})` } : null),
          }}
        />
      </div>
      {showMap && maps && (
        <img
          src={maps.displacement}
          alt="displacement map"
          className="rounded ring-1 ring-black/10"
          style={{ width: g.width * 1.5, height: g.height * 1.5, imageRendering: 'pixelated' }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                    */
/* -------------------------------------------------------------------------- */

function Dial({
  label,
  value,
  max = 1,
  onChange,
}: {
  label: string;
  value: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[12px]">
      <span className="w-[70px] opacity-70">{label}</span>
      <input
        type="range"
        min={0}
        max={max}
        step={0.01}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-[120px]"
      />
      <span className="w-9 text-right font-mono tabular-nums">{value.toFixed(2)}</span>
    </label>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-black/5 p-0.5 text-[12px] font-medium [[data-theme=dark]_&]:bg-white/10">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={
            'rounded-md px-2.5 py-1 ' +
            (option.value === value
              ? 'bg-white shadow-sm [[data-theme=dark]_&]:bg-white/20'
              : 'opacity-60 hover:opacity-100')
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const COLUMNS = ['Before · 0.5.0', 'After · new defaults', 'Custom'] as const;

function Icon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="4" />
    </svg>
  );
}

function LiveTabBar({ lens }: { lens: LensOptics }) {
  const [tab, setTab] = React.useState('explore');
  return (
    <TabBar value={tab} onValueChange={(value) => setTab(value as string)} lens={lens}>
      <TabBarItem value="home" icon={<Icon />}>
        Home
      </TabBarItem>
      <TabBarItem value="explore" icon={<Icon />}>
        Explore
      </TabBarItem>
      <TabBarItem value="saved" icon={<Icon />}>
        Saved
      </TabBarItem>
    </TabBar>
  );
}

function LiveSlider({ lens }: { lens: LensOptics }) {
  return (
    <Slider defaultValue={50} className="w-[220px]">
      <SliderControl>
        <SliderTrack>
          <SliderThumb lens={lens} aria-label="Value" />
        </SliderTrack>
      </SliderControl>
    </Slider>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function LensLab() {
  const [custom, setCustom] = React.useState<Record<ControlKey, Optics>>(DEFAULTS);
  const [backdrop, setBackdrop] = React.useState<Backdrop>('native');
  const [zoom, setZoom] = React.useState<'1' | '2' | '3'>('2');
  const [showMap, setShowMap] = React.useState(false);
  const [dark, setDark] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => setSupported(supportsRefraction()), []);
  React.useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  const set = (control: ControlKey, dial: keyof Optics) => (value: number) =>
    setCustom((all) => ({ ...all, [control]: { ...all[control], [dial]: value } }));

  const columns = (control: ControlKey): Optics[] => [BEFORE, DEFAULTS[control], custom[control]];

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(custom, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="mx-auto flex max-w-[1320px] flex-col gap-10 px-6 py-10"
      style={
        {
          '--lab-wallpaper': `url(/os/wallpaper-${dark ? 'dark' : 'light'}.jpg)`,
        } as React.CSSProperties
      }
    >
      <header className="flex flex-col gap-3">
        <h1 className="text-[28px] font-bold tracking-tight">Lens acceptance — dome &amp; fringe</h1>
        <p className="max-w-[760px] text-[14px] leading-relaxed opacity-75">
          <b>Curvature</b> adds a convex dome across the whole lens, so the middle magnifies
          instead of staying a flat window. <b>Dispersion</b> splits the bend into red, green and
          blue passes, fringing the rim. Each row compares the release before this change, the new
          defaults, and a column you can tune. Refraction is Chromium-only.
        </p>
        {!supported && (
          <p className="rounded-lg bg-amber-100 px-3 py-2 text-[13px] text-amber-900">
            This browser does not render <code>backdrop-filter: url()</code>. Open the page in
            Chrome or Edge to see the lenses.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            value={backdrop}
            onChange={setBackdrop}
            options={[
              { value: 'native', label: 'Native backdrop' },
              { value: 'grid', label: 'Grid' },
              { value: 'text', label: 'Text' },
              { value: 'wallpaper', label: 'Wallpaper' },
            ]}
          />
          <Segmented
            value={zoom}
            onChange={setZoom}
            options={[
              { value: '1', label: '1×' },
              { value: '2', label: '2×' },
              { value: '3', label: '3×' },
            ]}
          />
          <Segmented
            value={dark ? 'dark' : 'light'}
            onChange={(value) => setDark(value === 'dark')}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <label className="flex items-center gap-1.5 text-[12px] font-medium">
            <input type="checkbox" checked={showMap} onChange={(e) => setShowMap(e.target.checked)} />
            Show displacement maps
          </label>
          <button
            type="button"
            onClick={copy}
            className="rounded-lg bg-[var(--lq-accent)] px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            {copied ? 'Copied' : 'Copy custom values'}
          </button>
          <button
            type="button"
            onClick={() => setCustom(DEFAULTS)}
            className="rounded-lg bg-black/5 px-3 py-1.5 text-[12px] font-semibold [[data-theme=dark]_&]:bg-white/10"
          >
            Reset custom
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-[18px] font-semibold">Pressed specimens</h2>
        <div className="overflow-x-auto pb-2">
          <div className="flex w-max flex-col gap-4" style={{ zoom: Number(zoom) }}>
            <div className="grid grid-cols-3 gap-x-3">
              {COLUMNS.map((title) => (
                <span
                  key={title}
                  className="text-center text-[9px] font-semibold uppercase tracking-wide opacity-60"
                >
                  {title}
                </span>
              ))}
            </div>
            {(Object.keys(GEOMETRY) as ControlKey[]).map((control) => (
              <div key={control} className="grid grid-cols-3 items-start gap-x-3 gap-y-1">
                <span className="col-span-3 text-[10px] font-semibold opacity-80">
                  {GEOMETRY[control].label}
                </span>
                {columns(control).map((optics, i) => (
                  <Specimen
                    key={i}
                    control={control}
                    optics={optics}
                    backdrop={backdrop}
                    showMap={showMap}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 rounded-xl bg-black/[0.03] p-4 sm:grid-cols-3 [[data-theme=dark]_&]:bg-white/[0.05]">
          {(Object.keys(GEOMETRY) as ControlKey[]).map((control) => (
            <div key={control} className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold">
                Custom · {GEOMETRY[control].label}
                <span className="font-normal opacity-50">
                  {' '}
                  · default {DEFAULTS[control].curvature} / {DEFAULTS[control].dispersion}
                </span>
              </span>
              <Dial label="Curvature" value={custom[control].curvature} onChange={set(control, 'curvature')} />
              <Dial
                label="Dispersion"
                max={0.4}
                value={custom[control].dispersion}
                onChange={set(control, 'dispersion')}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[18px] font-semibold">Live components</h2>
        <p className="text-[13px] opacity-70">
          Press and hold, drag, toggle. Each column passes the matching optics through the
          component&apos;s <code>lens</code> prop.
        </p>
        <div
          className="overflow-hidden rounded-2xl bg-cover bg-center p-6"
          style={{ backgroundImage: 'var(--lab-wallpaper)' }}
        >
          <div className="grid grid-cols-3 gap-6">
            {COLUMNS.map((title) => (
              <span
                key={title}
                className="rounded-md bg-black/35 px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-white"
              >
                {title}
              </span>
            ))}
            {[BEFORE, DEFAULTS.switch, custom.switch].map((lens, i) => (
              <div key={`switch-${i}`} className="grid h-20 place-items-center">
                <Switch defaultChecked={i !== 0} lens={lens} aria-label="Switch" />
              </div>
            ))}
            {[BEFORE, DEFAULTS.slider, custom.slider].map((lens, i) => (
              <div key={`slider-${i}`} className="grid h-20 place-items-center">
                <LiveSlider lens={lens} />
              </div>
            ))}
            {[BEFORE, DEFAULTS.tab, custom.tab].map((lens, i) => (
              <div key={`tab-${i}`} className="grid h-24 place-items-center">
                <LiveTabBar lens={lens} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
