'use client';

import * as React from 'react';
import {
  Airplay,
  Bluetooth,
  Contrast,
  Copy,
  FastForward,
  Keyboard,
  Moon,
  Music2,
  PanelLeft,
  Pause,
  Play,
  Radar,
  Rewind,
  Sun,
  SunDim,
  Volume,
  Volume2,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { FINE_SLIDER, type GlassOptics } from '@/components/glass-controls';
import { cn } from '@/lib/utils';
import { Slider, SliderControl, SliderThumb, SliderTrack } from '@/registry/liqui/ui/slider';

/**
 * The stage's subject: a control center, modelled on the one macOS draws.
 *
 * It replaced a single form card because it makes the argument the card could
 * not. Liquid glass is not one panel; it is many small surfaces of different
 * shapes — capsules, discs, a tall tile, two wide slabs — each refracting on
 * its own, side by side over the same picture. Drag the group over an edge and
 * every module bends it differently, by its own size and corner.
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

interface Track {
  title: string;
  artist: string;
  art: string;
}

/** The same album the Media Player template plays, so the two pages agree. */
const TRACKS: Track[] = [
  {
    title: 'Refraction',
    artist: 'Anna Vey — Index of Light',
    art: 'linear-gradient(135deg, #ff5f8f, #ffb347 55%, #7b3fe4)',
  },
  {
    title: 'Bezel',
    artist: 'Anna Vey — Index of Light',
    art: 'linear-gradient(135deg, #2f7bff, #49e0c1 60%, #0d1b4a)',
  },
  {
    title: 'Dispersion',
    artist: 'Anna Vey — Prism Hours',
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
      className="select-none"
      style={{ gridColumn: `span ${cols}`, gridRow: `span ${rows}`, width: w, height: h }}
      contentClassName={cn('h-full rounded-[inherit]', className)}
    >
      {children}
    </LiquiGlass>
  );
}

/**
 * The disc a toggle's icon sits in. Lit, it is an opaque white button with the
 * accent icon — the one solid thing on the glass, which is how the platform
 * says "on". Unlit, it is a faint wash, still glass.
 */
function IconDisc({
  icon: Icon,
  on,
  size = 40,
  label,
  onToggle,
}: {
  icon: LucideIcon;
  on: boolean;
  size?: number;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={onToggle}
      style={{ width: size, height: size }}
      className={cn(
        'grid shrink-0 cursor-default place-items-center rounded-full outline-none transition-colors duration-200',
        'focus-visible:shadow-[0_0_0_2px_var(--lq-accent)] active:scale-[0.96]',
        on
          ? 'bg-white text-[var(--lq-accent)] shadow-[0_1px_4px_rgba(0,0,0,0.12)]'
          : 'bg-[color-mix(in_srgb,var(--lq-text)_12%,transparent)] text-[var(--lq-text)]',
      )}
    >
      <Icon className="size-[20px]" strokeWidth={2.2} />
    </button>
  );
}

/** Wi-Fi, Bluetooth, AirDrop, Focus: a disc and two lines, in a capsule. */
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
    <Module optics={optics} cols={2} rows={1} radius={CELL / 2} className="flex items-center gap-2.5 px-[11px]">
      <IconDisc icon={icon} on={on} label={title} onToggle={onToggle} />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[13px] font-semibold text-[var(--lq-text)]">{title}</div>
        {status && (
          <div className="truncate text-[11.5px] text-[var(--lq-text-dim)]">{status}</div>
        )}
      </div>
    </Module>
  );
}

/** A single-cell disc module. */
function DiscToggle({
  optics,
  icon,
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
    <Module optics={optics} cols={1} rows={1} radius={CELL / 2} className="grid place-items-center">
      <IconDisc icon={icon} on={on} size={44} label={label} onToggle={onToggle} />
    </Module>
  );
}

/** Display and Sound: a label over an icon-flanked slider, the full width. */
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
    <Module optics={optics} cols={4} rows={1} radius={22} className="flex flex-col justify-center gap-1.5 px-4">
      <span className="text-[12.5px] font-semibold text-[var(--lq-text)]">{title}</span>
      <div className="flex items-center gap-2.5 text-[var(--lq-text-dim)]">
        <Low className="size-4 shrink-0" />
        <Slider
          aria-label={title}
          value={value}
          onValueChange={(next) => onValueChange(Array.isArray(next) ? next[0] : next)}
          thumbAlignment="edge"
          style={FINE_SLIDER}
          className="flex-1"
        >
          <SliderControl>
            <SliderTrack>
              {/* On a module, so no lens — see the nesting note in
                  glass-controls.tsx. */}
              <SliderThumb lens={false} aria-label={title} />
            </SliderTrack>
          </SliderControl>
        </Slider>
        <High className="size-4 shrink-0" />
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
  const [mirroring, setMirroring] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);
  const [keyboard, setKeyboard] = React.useState(true);
  const [focus, setFocus] = React.useState(false);
  const [display, setDisplay] = React.useState(72);
  const [volume, setVolume] = React.useState(45);
  const [playing, setPlaying] = React.useState(false);
  const [trackIndex, setTrackIndex] = React.useState(0);

  const track = TRACKS[trackIndex];
  const step = (delta: number) =>
    setTrackIndex((index) => (index + delta + TRACKS.length) % TRACKS.length);

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(4, ${CELL}px)`,
        gridAutoRows: `${CELL}px`,
        gap: GAP,
      }}
    >
      {/* Rows 1–2, left: the two network toggles. Right: now playing, two
          rows tall. Grid auto-placement fills the left column first because
          the tall tile is declared second. */}
      <CapsuleToggle
        optics={optics}
        icon={Wifi}
        title="Wi-Fi"
        status={wifi ? 'Studio 5G' : 'Off'}
        on={wifi}
        onToggle={() => setWifi((on) => !on)}
      />

      <Module optics={optics} cols={2} rows={2} radius={22} className="flex flex-col p-3">
        <div className="flex items-start justify-between">
          <div
            aria-hidden
            className="grid size-11 place-items-center rounded-[11px] text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
            style={{ background: track.art }}
          >
            <Music2 className="size-5" strokeWidth={2.2} />
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-[var(--lq-text-dim)] uppercase">
            {playing ? 'Playing' : 'Paused'}
          </span>
        </div>
        <div className="mt-auto min-w-0 leading-tight">
          <div className="truncate text-[13px] font-semibold text-[var(--lq-text)]">{track.title}</div>
          <div className="truncate text-[11.5px] text-[var(--lq-text-dim)]">{track.artist}</div>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[var(--lq-text)]">
          <TransportButton label="Previous track" onClick={() => step(-1)}>
            <Rewind className="size-[18px]" fill="currentColor" strokeWidth={0} />
          </TransportButton>
          <TransportButton label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>
            {playing ? (
              <Pause className="size-[20px]" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play className="size-[20px]" fill="currentColor" strokeWidth={0} />
            )}
          </TransportButton>
          <TransportButton label="Next track" onClick={() => step(1)}>
            <FastForward className="size-[18px]" fill="currentColor" strokeWidth={0} />
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
        status={airdrop ? 'Contacts only' : 'Off'}
        on={airdrop}
        onToggle={() => setAirdrop((on) => !on)}
      />
      <DiscToggle
        optics={optics}
        icon={PanelLeft}
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
        icon={Keyboard}
        label="Keyboard Brightness"
        on={keyboard}
        onToggle={() => setKeyboard((on) => !on)}
      />
      <CapsuleToggle
        optics={optics}
        icon={Moon}
        title="Focus"
        status={focus ? 'Do Not Disturb' : undefined}
        on={focus}
        onToggle={() => setFocus((on) => !on)}
      />

      {/* Rows 5–6 */}
      <SliderModule
        optics={optics}
        title="Display"
        value={display}
        onValueChange={setDisplay}
        low={SunDim}
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
            className="grid size-7 shrink-0 cursor-default place-items-center rounded-full bg-[color-mix(in_srgb,var(--lq-text)_12%,transparent)] text-[var(--lq-text)] outline-none focus-visible:shadow-[0_0_0_2px_var(--lq-accent)]"
          >
            <Airplay className="size-3.5" strokeWidth={2.2} />
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
      className="grid size-8 cursor-default place-items-center rounded-full outline-none transition-[background-color,scale] hover:bg-[color-mix(in_srgb,var(--lq-text)_10%,transparent)] focus-visible:shadow-[0_0_0_2px_var(--lq-accent)] active:scale-[0.92]"
    >
      {children}
    </button>
  );
}
