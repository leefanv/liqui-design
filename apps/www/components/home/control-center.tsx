'use client';

import * as React from 'react';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import { useTheme } from 'fumadocs-ui/provider/base';

import type { GlassOptics } from '@/components/glass-controls';
import {
  AirDropGlyph,
  AirPlayAudioGlyph,
  AppearanceGlyph,
  BackwardGlyph,
  BluetoothGlyph,
  ForwardGlyph,
  MenuBarGlyph,
  MirroringGlyph,
  MoonGlyph,
  PauseGlyph,
  PlayGlyph,
  SpeakerHighGlyph,
  SpeakerLowGlyph,
  StageManagerGlyph,
  SunHighGlyph,
  SunLowGlyph,
  WifiGlyph,
} from '@/components/home/control-center-glyphs';
import { cn } from '@/lib/utils';
import { coverArt, TRACKS } from '@/registry/liqui/lib/media-player-data';
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
 * module pitch with 12px gaps, 36px icon discs in the capsules, white type
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

/**
 * Corners for the modules that are not capsules or discs, both measured off
 * the system (2× captures).
 *
 * The Now Playing tile's corner is a continuous curve — it eases into the
 * straight edge over a long run, tighter than a circle near the corner —
 * sitting about 8px in from its bounding corner at 45°. The squircle is the
 * nearer of our two shapes; drawn 1.4× (see SQUIRCLE_RADIUS_SCALE), 36 lands
 * that inset at 50.
 *
 * The slabs are the other way round: their ends trace a plain quarter circle
 * of radius ~23.5pt on a 64pt module, with a short straight run between —
 * neither a capsule nor anything a squircle fits — so they ask for
 * `corner: 'round'` at the same proportion of their 62px.
 */
const TILE_RADIUS = 36;
const SLAB_RADIUS = 23;

/** A glyph from control-center-glyphs.tsx: sized by itself, overridable. */
type Glyph = (props: { className?: string }) => React.ReactNode;

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
 *
 * Mid grey, not light grey: over the day wallpaper's sky a light wash left the
 * white type at barely 1.5:1, and the platform's own modules darken what is
 * behind them for the same reason. Over the dark backdrops the difference is
 * a shade; over the bright ones it is the difference between reading and not.
 */
const PALETTE = {
  '--lq-text': '#ffffff',
  '--lq-text-dim': 'rgba(255,255,255,0.82)',
  '--lq-tint': 'rgba(172,172,180,0.46)',
  '--lq-tint-deep': 'rgba(128,128,138,0.4)',
  '--lq-rim-hi': 'rgba(255,255,255,0.95)',
  '--lq-rim-lo': 'rgba(255,255,255,0.55)',
} as React.CSSProperties;

/** The system indigo Focus is drawn in — on a white disc, so the light-mode value. */
const FOCUS_INDIGO = '#5856d6';

/** Washes on the glass, white over grey. */
const WASH = 'bg-[rgba(255,255,255,0.22)]';
const WASH_HOVER = 'hover:bg-[rgba(255,255,255,0.3)]';

/* -------------------------------------------------------------------------- */
/* Module shells                                                               */
/* -------------------------------------------------------------------------- */

function Module({
  optics,
  cols,
  rows,
  radius,
  corner,
  className,
  children,
}: {
  optics: GlassOptics;
  cols: number;
  rows: number;
  radius: number;
  corner?: 'squircle' | 'round';
  className?: string;
  children: React.ReactNode;
}) {
  const w = span(cols);
  const h = span(rows);
  return (
    <LiquiGlass
      {...glassFor(optics, w, h)}
      radius={radius}
      corner={corner}
      className="select-none"
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
 *
 * The lit glyph is the accent unless the module has a colour of its own, as
 * Focus does: the platform draws it indigo, not blue, so that "a Focus is on"
 * and "the network is on" do not read as the same fact.
 */
function IconDisc({
  icon: Icon,
  on,
  label,
  color,
  onToggle,
}: {
  icon: Glyph;
  on: boolean;
  label: string;
  color?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={onToggle}
      style={on && color ? { color } : undefined}
      className={cn(
        'grid size-[36px] shrink-0 cursor-default place-items-center rounded-full outline-none',
        'transition-[background-color,color,box-shadow,scale] duration-200 ease-out',
        'focus-visible:shadow-[0_0_0_2px_var(--lq-accent)] active:scale-[0.92]',
        on
          ? 'bg-white text-[var(--lq-accent)]'
          : cn(WASH, WASH_HOVER, 'text-white'),
      )}
    >
      <Icon />
    </button>
  );
}

/** Wi-Fi, Bluetooth, AirDrop, Focus: a disc and one or two lines, in a capsule. */
function CapsuleToggle({
  optics,
  icon,
  title,
  status,
  color,
  on,
  onToggle,
}: {
  optics: GlassOptics;
  icon: Glyph;
  title: string;
  status?: string;
  color?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Module optics={optics} cols={2} rows={1} radius={CELL / 2} className="flex items-center gap-[7px] pr-2.5 pl-[13px]">
      <IconDisc icon={icon} on={on} label={title} color={color} onToggle={onToggle} />
      <div className="min-w-0 leading-[1.2]">
        <div className="truncate text-[13px] font-semibold">{title}</div>
        {status && <div className="truncate text-[12px] font-semibold text-[var(--lq-text-dim)]">{status}</div>}
      </div>
    </Module>
  );
}

/**
 * A single-cell module. No inner disc — the icon sits straight on the glass,
 * and the whole module is the button. Lit, the whole disc fills solid white
 * with the glyph in black, as the platform draws Dark Mode switched on — the
 * same white the capsules' icon discs light to, so "on" reads one way across
 * the panel, and over a night wallpaper as clearly as over a day one.
 */
function DiscToggle({
  optics,
  icon: Icon,
  label,
  on,
  onToggle,
}: {
  optics: GlassOptics;
  icon: Glyph;
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
          'group grid size-full cursor-default place-items-center rounded-full outline-none transition-colors duration-200',
          'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
          // The module itself can't shrink — it is the glass, and its edge is
          // what refracts — so a press darkens it and shrinks the glyph instead.
          on
            ? 'bg-white text-black active:bg-[rgba(255,255,255,0.82)]'
            : 'hover:bg-[rgba(255,255,255,0.12)] active:bg-[rgba(0,0,0,0.1)]',
        )}
      >
        <Icon className="transition-[scale] duration-150 ease-out group-active:scale-[0.88]" />
      </button>
    </Module>
  );
}

/**
 * Display and Sound: a heading over the library's own Slider, between a small
 * and a large glyph, set the way the system sets it. The fill is white, not
 * the accent blue, and the rail is a 4px hairline rather than the stock 8px.
 * The knob — and the lens it becomes under a finger — only shows while the
 * pointer is over the slider, while it is being dragged, or while it has
 * keyboard focus; at rest the fill alone is the reading.
 */
const MODULE_SLIDER = {
  '--lq-rail-h': '4px',
  // The stock knob is 16px tall; this keeps the control exactly that tall
  // around the thinner rail, so the hit area doesn't shrink with it.
  '--lq-knob-pad': '6px',
  '--lq-accent': '#ffffff',
  '--lq-slider-rail': 'rgba(255,255,255,0.3)',
} as React.CSSProperties;

const KNOB_REVEAL = cn(
  'scale-50 opacity-0 transition-[opacity,scale] duration-200 ease-out',
  'group-hover/slider:scale-100 group-hover/slider:opacity-100',
  'data-[dragging]:scale-100 data-[dragging]:opacity-100',
  'has-[:focus-visible]:scale-100 has-[:focus-visible]:opacity-100',
);

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
  low: Glyph;
  high: Glyph;
  trailing?: React.ReactNode;
}) {
  return (
    <Module
      optics={optics}
      cols={4}
      rows={1}
      radius={SLAB_RADIUS}
      corner="round"
      className="flex flex-col justify-center gap-[7px] px-4"
    >
      <span className="text-[13px] leading-none font-semibold">{title}</span>
      {/* Glyphs sit about 6px off the rail's ends, as the system sets them. */}
      <div className="flex items-center gap-[7px]">
        <Low className="shrink-0 text-[var(--lq-text-dim)]" />
        <Slider
          aria-label={title}
          value={value}
          onValueChange={(next) => onValueChange(Array.isArray(next) ? next[0] : next)}
          // Centred, not edge-aligned: the knob is usually hidden, so the
          // fill has to read the value on its own — empty at 0, full at 100.
          // Edge alignment would stop it half a knob short of either end.
          thumbAlignment="center"
          style={MODULE_SLIDER}
          className="group/slider flex-1"
        >
          <SliderControl>
            <SliderTrack>
              <SliderThumb aria-label={title} className={KNOB_REVEAL} />
            </SliderTrack>
          </SliderControl>
        </Slider>
        <High className="shrink-0 text-[var(--lq-text-dim)]" />
        {trailing && <div className="ml-1.5 flex">{trailing}</div>}
      </div>
    </Module>
  );
}

/** AirDrop's glyph carries its state: slashed while off. */
const AirDropOn: Glyph = ({ className }) => <AirDropGlyph className={className} />;
const AirDropOff: Glyph = ({ className }) => <AirDropGlyph className={className} off />;

/* -------------------------------------------------------------------------- */
/* Control center                                                              */
/* -------------------------------------------------------------------------- */

export const CONTROL_CENTER_WIDTH = span(4);

/**
 * What Now Playing cycles through. It opens on a real record — a photograph
 * reads as album art in a way a generated gradient never quite does — and
 * the transport then steps on into the Media Player template's library, whose
 * covers are drawn in CSS from each track's palette.
 *
 * The cover is the 1967 US sleeve of *Are You Experienced*, from Wikimedia
 * Commons, where it is tagged PD-US-no notice: published in the US without a
 * copyright notice, so in the public domain there.
 * https://commons.wikimedia.org/wiki/File:Are_You_Experienced_-_US_cover-edit.jpg
 */
interface NowPlayingTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: React.CSSProperties;
}

const PLAYLIST: NowPlayingTrack[] = [
  {
    id: 'purple-haze',
    title: 'Purple Haze',
    artist: 'The Jimi Hendrix Experience',
    album: 'Are You Experienced',
    cover: {
      backgroundImage: 'url(/home/are-you-experienced.jpg)',
      backgroundSize: 'cover',
    },
  },
  ...TRACKS.map(({ id, title, artist, album, palette }) => ({
    id,
    title,
    artist,
    album,
    cover: coverArt(palette),
  })),
];

/**
 * Dark Mode is the one toggle here that is not pretend: it reads and sets the
 * site's own appearance — the same setting as the light / dark switch in the
 * header — so flipping it turns the whole page, docs included.
 *
 * The resolved theme is unknown until the client has mounted (next-themes
 * reads it from storage and the media query), so the toggle renders off on
 * the server and on the first client pass, and only then shows the real state;
 * reading it any earlier would mismatch the server's HTML.
 */
function useDarkMode(): [boolean, () => void] {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === 'dark';
  return [dark, () => setTheme(dark ? 'light' : 'dark')];
}

const noopSubscribe = () => () => {};

export function ControlCenter({ optics }: { optics: GlassOptics }) {
  const [wifi, setWifi] = React.useState(true);
  const [bluetooth, setBluetooth] = React.useState(true);
  const [airdrop, setAirdrop] = React.useState(false);
  const [stageManager, setStageManager] = React.useState(false);
  const [mirroring, setMirroring] = React.useState(false);
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [menuBar, setMenuBar] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const [display, setDisplay] = React.useState(96);
  const [volume, setVolume] = React.useState(82);
  const [playing, setPlaying] = React.useState(false);
  const [trackIndex, setTrackIndex] = React.useState(0);

  const track = PLAYLIST[trackIndex];
  const step = (delta: number) =>
    setTrackIndex((index) => (index + delta + PLAYLIST.length) % PLAYLIST.length);

  return (
    <div
      className="flex flex-col items-center gap-[18px] text-white"
      style={PALETTE}
    >
      <div
        className="grid"
        style={{
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
          icon={WifiGlyph}
          title="Wi-Fi"
          status={wifi ? 'Studio 5G' : 'Off'}
          on={wifi}
          onToggle={() => setWifi((on) => !on)}
        />

        <Module
          optics={optics}
          cols={2}
          rows={2}
          radius={TILE_RADIUS}
          className="flex flex-col px-3.5 pt-3.5"
        >
          {/* The album's art, as the platform shows it: a square, top left,
              with the title and artist under it and the transport along the
              bottom. See PLAYLIST for where the covers come from. */}
          <div
            aria-hidden
            className="size-[39px] shrink-0 rounded-[8px]"
            style={track.cover}
          />
          {/* Artist alone under the title: with the album on the same line the
              tile cut it to "Anna Vey – Inde…", which says less than either. The
              album stays in the accessible name. */}
          {/* Measured off the system: the title's cap line sits ~65px down the
              tile, so the text hangs nearer the transport than the art. */}
          <div className="mt-[9px] min-w-0 leading-[1.25]" title={`${track.title} — ${track.artist}, ${track.album}`}>
            <div className="truncate text-[13px] font-semibold">{track.title}</div>
            {/* Lighter than the title but not dimmer: the system sets the
                artist in white at a regular weight, not grey. */}
            <div className="truncate text-[12px] font-medium">
              {track.artist}
              <span className="sr-only">, {track.album}</span>
            </div>
          </div>
          {/* Spread wider than the padding: the system centres the outer two
              about 29px in from each edge, with Play on the tile's centre, and
              the row's centre ~108px down. The buttons' hit areas are taller
              than the glyphs, so they tuck up under the artist line. */}
          <div className="-mx-[3px] -mt-[3.5px] flex items-center justify-between">
            <TransportButton label="Previous track" onClick={() => step(-1)}>
              <BackwardGlyph />
            </TransportButton>
            <TransportButton label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>
              {playing ? (
                <PauseGlyph />
              ) : (
                <PlayGlyph />
              )}
            </TransportButton>
            <TransportButton label="Next track" onClick={() => step(1)}>
              <ForwardGlyph />
            </TransportButton>
          </div>
        </Module>

        <CapsuleToggle
          optics={optics}
          icon={BluetoothGlyph}
          title="Bluetooth"
          status={bluetooth ? 'On' : 'Off'}
          on={bluetooth}
          onToggle={() => setBluetooth((on) => !on)}
        />

        {/* Row 3 */}
        <CapsuleToggle
          optics={optics}
          icon={airdrop ? AirDropOn : AirDropOff}
          title="AirDrop"
          status={airdrop ? 'Contacts' : 'Off'}
          on={airdrop}
          onToggle={() => setAirdrop((on) => !on)}
        />
        <DiscToggle
          optics={optics}
          icon={StageManagerGlyph}
          label="Stage Manager"
          on={stageManager}
          onToggle={() => setStageManager((on) => !on)}
        />
        <DiscToggle
          optics={optics}
          icon={MirroringGlyph}
          label="Screen Mirroring"
          on={mirroring}
          onToggle={() => setMirroring((on) => !on)}
        />

        {/* Row 4 */}
        <DiscToggle
          optics={optics}
          icon={AppearanceGlyph}
          label="Dark Mode"
          on={darkMode}
          onToggle={toggleDarkMode}
        />
        <DiscToggle
          optics={optics}
          icon={MenuBarGlyph}
          label="Hide Menu Bar"
          on={menuBar}
          onToggle={() => setMenuBar((on) => !on)}
        />
        <CapsuleToggle
          optics={optics}
          icon={MoonGlyph}
          title="Focus"
          status={focus ? 'On' : undefined}
          color={FOCUS_INDIGO}
          on={focus}
          onToggle={() => setFocus((on) => !on)}
        />

        {/* Rows 5–6 */}
        <SliderModule
          optics={optics}
          title="Display"
          value={display}
          onValueChange={setDisplay}
          low={SunLowGlyph}
          high={SunHighGlyph}
        />
        <SliderModule
          optics={optics}
          title="Sound"
          value={volume}
          onValueChange={setVolume}
          low={SpeakerLowGlyph}
          high={SpeakerHighGlyph}
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
              <AirPlayAudioGlyph />
            </button>
          }
        />
      </div>
      <EditControls optics={optics} />
    </div>
  );
}

/**
 * The capsule the system sets under its modules. Here it is decoration and
 * says so, like the window lights on the optics panel: `aria-hidden`, no
 * hover, nothing to click — there are no controls to edit, and a button that
 * did nothing would be worse than a label.
 */
function EditControls({ optics }: { optics: GlassOptics }) {
  return (
    <LiquiGlass
      {...glassFor(optics, 96, 26)}
      radius={13}
      aria-hidden
      className="pointer-events-none select-none"
      contentClassName="rounded-[inherit]"
    >
      <div className="px-3 py-[5px] text-[13px] leading-4 font-semibold">Edit Controls</div>
    </LiquiGlass>
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
      // Solid white, as the system draws them. Never a translucent colour: the
      // glyphs are filled and stroked to round their points, and a translucent
      // colour shows where the two overlap as a brighter outline.
      className="grid size-9 cursor-default place-items-center rounded-full text-white outline-none transition-[background-color,scale] hover:bg-[rgba(255,255,255,0.14)] focus-visible:shadow-[0_0_0_2px_var(--lq-accent)] active:scale-[0.92]"
    >
      {children}
    </button>
  );
}
