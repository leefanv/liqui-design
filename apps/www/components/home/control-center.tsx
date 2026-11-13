'use client';

import * as React from 'react';
import {
  Airplay,
  Bluetooth,
  Contrast,
  Copy,
  FastForward,
  Moon,
  Music2,
  PanelBottom,
  PanelLeftDashed,
  Pause,
  Play,
  Radar,
  Rewind,
  Sun,
  Volume,
  Volume2,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import type { GlassOptics } from '@/components/glass-controls';
import { cn } from '@/lib/utils';
import { Slider, SliderControl, SliderThumb, SliderTrack } from '@/registry/liqui/ui/slider';

/**
 * The stage's subject: a control center, drawn to the one macOS 26 ships.
 *
 * It replaced a single form card because it makes the argument the card could
 * not. Liquid glass is not one panel; it is many small surfaces of different
 * shapes — capsules, discs, a tall tile, two wide slabs — each refracting on
 * its own, side by side over the same picture. Drag the group over an edge and
 * every module bends it differently, by its own size and corner.
 *
 * The measurements are taken off the system's own control center: a 62px
 * module pitch with 12px gaps, 38px icon discs in the capsules, white type
 * over a neutral grey glass with a dark drop under every module. That last
 * pair is why this scopes its own tokens rather than following the page
 * theme — the platform draws this panel white-on-grey in light and dark mode
 * alike, and so does this.
 *
 * Every module is a separate LiquiGlass. The optics panel drives all of them,
 * but its Strength and Bezel are dialled for a card-sized surface, and the
 * same pixels on a 62px disc are most of the disc — the backdrop smears
 * instead of bending. So each module takes them scaled by its own short side
 * (see `glassFor`), the way the registry's small components ask for smaller
 * numbers than its popups do.
 */

/** One grid cell and the gap between cells, in px — the macOS module pitch. */
const CELL = 62;
const GAP = 12;
const span = (cells: number) => cells * CELL + (cells - 1) * GAP;

/** Short side at which a module takes the panel's numbers unscaled. */
const REFERENCE = 220;

function glassFor(optics: GlassOptics, w: number, h: number): Partial<LiquiGlassProps> {
  const k = Math.min(1, Math.max(0.25, Math.min(w, h) / REFERENCE));
  return {
    ...optics,
    refraction: optics.refraction * k,
    bezel: Math.max(4, optics.bezel * k),
  };
}

/**
 * The panel's own palette. A neutral grey wash rather than the library's white
 * one — white type needs something under it to stand on — and a brighter rim,
 * since a module this small reads as glass mostly by its edge.
 */
const PALETTE = {
  '--lq-text': '#ffffff',
  '--lq-text-dim': 'rgba(255,255,255,0.8)',
  '--lq-tint': 'rgba(206,206,212,0.42)',
  '--lq-tint-deep': 'rgba(168,168,176,0.34)',
  '--lq-rim-hi': 'rgba(255,255,255,0.95)',
  '--lq-rim-lo': 'rgba(255,255,255,0.55)',
} as React.CSSProperties;

/** A dark drop under each module — the platform lifts every one off the desk. */
const MODULE_SHADOW = 'shadow-[0_10px_24px_-8px_rgba(0,0,0,0.38),0_2px_6px_-2px_rgba(0,0,0,0.18)]';

/** Washes on the glass, white over grey. */
const WASH = 'bg-[rgba(255,255,255,0.22)]';
const WASH_HOVER = 'hover:bg-[rgba(255,255,255,0.3)]';

interface Track {
  title: string;
  artist: string;
  art: string;
}

/** The same album the Media Player template plays, so the two pages agree. */
const TRACKS: Track[] = [
  {
    title: 'Refraction',
    artist: 'Anna Vey – Index of Light',
    art: 'linear-gradient(135deg, #ff4d6d, #ff2e4f 55%, #c9143a)',
  },
  {
    title: 'Bezel',
    artist: 'Anna Vey – Index of Light',
    art: 'linear-gradient(135deg, #2f7bff, #49e0c1 60%, #0d1b4a)',
  },
  {
    title: 'Dispersion',
    artist: 'Anna Vey – Prism Hours',
    art: 'linear-gradient(135deg, #b35cff, #ff5a5f 50%, #ffd23f)',
  },
];

/* -------------------------------------------------------------------------- */
/* Module shells                                                               */
/* -------------------------------------------------------------------------- */

function Module({
  optics,
  cols,
  rows,
  radius,
  className,
  children,
}: {
  optics: GlassOptics;
  cols: number;
  rows: number;
  radius: number;
  className?: string;
  children: React.ReactNode;
}) {
  const w = span(cols);
  const h = span(rows);
  return (
    <LiquiGlass
      {...glassFor(optics, w, h)}
      radius={radius}
      className={cn('select-none', MODULE_SHADOW)}
      style={{ gridColumn: `span ${cols}`, gridRow: `span ${rows}`, width: w, height: h }}
      contentClassName={cn('h-full rounded-[inherit]', className)}
    >
      {children}
    </LiquiGlass>
  );
}

/**
 * The disc a capsule's icon sits in. Lit, it is an opaque white button with
 * the accent icon — the one solid thing on the glass, which is how the
 * platform says "on". Unlit, a white wash with a white icon: still glass.
 */
function IconDisc({
  icon: Icon,
  on,
  label,
  onToggle,
}: {
  icon: LucideIcon;
  on: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        'grid size-[38px] shrink-0 cursor-default place-items-center rounded-full outline-none transition-colors duration-200',
        'focus-visible:shadow-[0_0_0_2px_var(--lq-accent)] active:scale-[0.95]',
        on
          ? 'bg-white text-[var(--lq-accent)] shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
          : cn(WASH, WASH_HOVER, 'text-white'),
      )}
    >
      <Icon className="size-[19px]" strokeWidth={2.3} />
    </button>
  );
}

/** Wi-Fi, Bluetooth, AirDrop, Focus: a disc and one or two lines, in a capsule. */
function CapsuleToggle({
  optics,
  icon,
  title,
  status,
  on,
  onToggle,
}: {
  optics: GlassOptics;
  icon: LucideIcon;
  title: string;
  status?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Module optics={optics} cols={2} rows={1} radius={CELL / 2} className="flex items-center gap-[9px] pl-3 pr-2.5">
      <IconDisc icon={icon} on={on} label={title} onToggle={onToggle} />
      <div className="min-w-0 leading-[1.2]">
        <div className="truncate text-[13.5px] font-semibold">{title}</div>
        {status && <div className="truncate text-[12px] font-semibold text-[var(--lq-text-dim)]">{status}</div>}
      </div>
    </Module>
  );
}

/**
 * A single-cell module. No inner disc — the icon sits straight on the glass,
 * and the whole module is the button. Lit, it fills dark, as the platform
 * draws an engaged mode like Screen Mirroring.
 */
function DiscToggle({
  optics,
  icon: Icon,
  label,
  on,
  onToggle,
}: {
  optics: GlassOptics;
  icon: LucideIcon;
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Module optics={optics} cols={1} rows={1} radius={CELL / 2}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={on}
        onClick={onToggle}
        className={cn(
          'grid size-full cursor-default place-items-center rounded-full outline-none transition-colors duration-200',
          'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
          on ? 'bg-[rgba(36,36,40,0.62)]' : 'hover:bg-[rgba(255,255,255,0.12)]',
        )}
      >
        <Icon className="size-[23px]" strokeWidth={2} />
      </button>
    </Module>
  );
}

/**
 * Display and Sound: a heading over a white hairline slider between a small
 * and a large glyph. The platform's slider has no knob — the fill is the
 * reading — so the knob here shrinks to the rail's own height and vanishes
 * into the end of the fill, while the control keeps a finger-sized hit area.
 */
const MODULE_SLIDER = {
  '--lq-rail-h': '4px',
  '--lq-knob-w': '4px',
  '--lq-knob-h': '4px',
  '--lq-knob-pad': '0px',
  '--lq-accent': '#ffffff',
  '--lq-slider-rail': 'rgba(255,255,255,0.3)',
} as React.CSSProperties;

function SliderModule({
  optics,
  title,
  value,
  onValueChange,
  low: Low,
  high: High,
  trailing,
}: {
  optics: GlassOptics;
  title: string;
  value: number;
  onValueChange: (next: number) => void;
  low: LucideIcon;
  high: LucideIcon;
  trailing?: React.ReactNode;
}) {
  return (
    <Module optics={optics} cols={4} rows={1} radius={20} className="flex flex-col justify-center gap-[7px] px-4">
      <span className="text-[13.5px] leading-none font-semibold">{title}</span>
      <div className="flex items-center gap-3">
        <Low className="size-[13px] shrink-0 text-[var(--lq-text-dim)]" strokeWidth={2.2} />
        <Slider
          aria-label={title}
          value={value}
          onValueChange={(next) => onValueChange(Array.isArray(next) ? next[0] : next)}
          thumbAlignment="edge"
          style={MODULE_SLIDER}
          className="flex-1"
        >
          <SliderControl className="py-2">
            <SliderTrack>
              {/* On a module, so no lens — see the nesting note in
                  glass-controls.tsx. */}
              <SliderThumb lens={false} aria-label={title} className="shadow-none" />
            </SliderTrack>
          </SliderControl>
        </Slider>
        <High className="size-[17px] shrink-0 text-[var(--lq-text-dim)]" strokeWidth={2} />
        {trailing}
      </div>
    </Module>
  );
}

/* -------------------------------------------------------------------------- */
/* Control center                                                              */
/* -------------------------------------------------------------------------- */

export const CONTROL_CENTER_WIDTH = span(4);

export function ControlCenter({ optics }: { optics: GlassOptics }) {
  const [wifi, setWifi] = React.useState(true);
  const [bluetooth, setBluetooth] = React.useState(true);
  const [airdrop, setAirdrop] = React.useState(false);
  const [stageManager, setStageManager] = React.useState(false);
  const [mirroring, setMirroring] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [menuBar, setMenuBar] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const [display, setDisplay] = React.useState(96);
  const [volume, setVolume] = React.useState(82);
  const [playing, setPlaying] = React.useState(false);
  const [trackIndex, setTrackIndex] = React.useState(0);

  const track = TRACKS[trackIndex];
  const step = (delta: number) =>
    setTrackIndex((index) => (index + delta + TRACKS.length) % TRACKS.length);

  return (
    <div
      className="grid text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.22)]"
      style={{
        ...PALETTE,
        gridTemplateColumns: `repeat(4, ${CELL}px)`,
        gridAutoRows: `${CELL}px`,
        gap: GAP,
      }}
    >
      {/* Rows 1–2, left: the two network toggles. Right: now playing, two
          rows tall. Auto-placement puts Bluetooth under Wi-Fi because the
          tall tile has already claimed the right half of both rows. */}
      <CapsuleToggle
        optics={optics}
        icon={Wifi}
        title="Wi-Fi"
        status={wifi ? 'Studio 5G' : 'Off'}
        on={wifi}
        onToggle={() => setWifi((on) => !on)}
      />

      <Module optics={optics} cols={2} rows={2} radius={20} className="flex flex-col px-3.5 pt-3.5 pb-2">
        {/* The app's icon in a frosted well, as the platform shows the source
            of what is playing — not the album art, which belongs to the
            player itself. */}
        <div aria-hidden className={cn('grid size-[40px] place-items-center rounded-[10px]', WASH)}>
          <div
            className="grid size-[24px] place-items-center rounded-[6px] text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
            style={{ background: track.art }}
          >
            <Music2 className="size-[14px]" strokeWidth={2.6} />
          </div>
        </div>
        <div className="mt-auto min-w-0 leading-[1.2]">
          <div className="truncate text-[13.5px] font-semibold">{track.title}</div>
          <div className="truncate text-[12px] font-semibold text-[var(--lq-text-dim)]">{track.artist}</div>
        </div>
        <div className="mt-1 flex items-center justify-between px-1">
          <TransportButton label="Previous track" onClick={() => step(-1)}>
            <Rewind className="size-[21px]" fill="currentColor" strokeWidth={0} />
          </TransportButton>
          <TransportButton label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>
            {playing ? (
              <Pause className="size-[21px]" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play className="size-[21px]" fill="currentColor" strokeWidth={0} />
            )}
          </TransportButton>
          <TransportButton label="Next track" onClick={() => step(1)}>
            <FastForward className="size-[21px]" fill="currentColor" strokeWidth={0} />
          </TransportButton>
        </div>
      </Module>

      <CapsuleToggle
        optics={optics}
        icon={Bluetooth}
        title="Bluetooth"
        status={bluetooth ? 'On' : 'Off'}
        on={bluetooth}
        onToggle={() => setBluetooth((on) => !on)}
      />

      {/* Row 3 */}
      <CapsuleToggle
        optics={optics}
        icon={Radar}
        title="AirDrop"
        status={airdrop ? 'Contacts Only' : 'Off'}
        on={airdrop}
        onToggle={() => setAirdrop((on) => !on)}
      />
      <DiscToggle
        optics={optics}
        icon={PanelLeftDashed}
        label="Stage Manager"
        on={stageManager}
        onToggle={() => setStageManager((on) => !on)}
      />
      <DiscToggle
        optics={optics}
        icon={Copy}
        label="Screen Mirroring"
        on={mirroring}
        onToggle={() => setMirroring((on) => !on)}
      />

      {/* Row 4 */}
      <DiscToggle
        optics={optics}
        icon={Contrast}
        label="Dark Mode"
        on={darkMode}
        onToggle={() => setDarkMode((on) => !on)}
      />
      <DiscToggle
        optics={optics}
        icon={PanelBottom}
        label="Hide Menu Bar"
        on={menuBar}
        onToggle={() => setMenuBar((on) => !on)}
      />
      <CapsuleToggle
        optics={optics}
        icon={Moon}
        title="Focus"
        on={focus}
        onToggle={() => setFocus((on) => !on)}
      />

      {/* Rows 5–6 */}
      <SliderModule
        optics={optics}
        title="Display"
        value={display}
        onValueChange={setDisplay}
        low={Sun}
        high={Sun}
      />
      <SliderModule
        optics={optics}
        title="Sound"
        value={volume}
        onValueChange={setVolume}
        low={Volume}
        high={Volume2}
        trailing={
          <button
            type="button"
            aria-label="AirPlay"
            className={cn(
              'grid size-[26px] shrink-0 cursor-default place-items-center rounded-full outline-none',
              WASH,
              WASH_HOVER,
              'focus-visible:shadow-[0_0_0_2px_var(--lq-accent)]',
            )}
          >
            <Airplay className="size-[14px]" strokeWidth={2.2} />
          </button>
        }
      />
    </div>
  );
}

function TransportButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 cursor-default place-items-center rounded-full text-[rgba(255,255,255,0.88)] outline-none transition-[background-color,scale] hover:bg-[rgba(255,255,255,0.14)] focus-visible:shadow-[0_0_0_2px_var(--lq-accent)] active:scale-[0.92]"
    >
      {children}
    </button>
  );
}
