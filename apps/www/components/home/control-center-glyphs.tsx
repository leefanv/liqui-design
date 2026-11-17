'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The control center's glyphs, drawn for it rather than taken from lucide.
 *
 * The system's are filled and layered: a solid shape where lucide has an
 * outline, and a secondary part at reduced opacity — the frame of the Stage
 * Manager glyph, the window of Hide Menu Bar — so the eye lands on the part
 * that changes. Lucide's line icons at one stroke weight read as a different
 * family beside white type on glass, and several have no counterpart at all
 * (AirDrop, AirPlay for audio, the three-wave speaker).
 *
 * Each draws at the size the system does, measured off a 2× capture, in a
 * viewBox of the same proportions — so one viewBox unit is about one point,
 * and a glyph that is wider than it is tall keeps its width instead of being
 * shrunk into a square. Sizes are classes, so a caller can still override
 * them. All are decoration: the button around each carries the name.
 */

type GlyphProps = { className?: string };

/** Points on a circle, for arcs that open toward the bottom. */
function at(cx: number, cy: number, r: number, degrees: number) {
  const a = (degrees * Math.PI) / 180;
  return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
}

/** An arc from `from`° to `to`° clockwise (SVG angles: 0° right, 90° down). */
function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const large = (to - from + 360) % 360 > 180 ? 1 : 0;
  return `M${at(cx, cy, r, from)}A${r} ${r} 0 ${large} 1 ${at(cx, cy, r, to)}`;
}

/* -------------------------------------------------------------------------- */
/* Capsule glyphs — drawn into a 36px disc                                     */
/* -------------------------------------------------------------------------- */

/** Three bands fanning up from a rounded wedge. */
export function WifiGlyph({ className }: GlyphProps) {
  const cx = 10;
  const cy = 13.6;
  return (
    <svg viewBox="0 0 20 15" className={cn('h-[15px] w-[20px]', className)} aria-hidden>
      <path
        d={`M${cx} ${cy}L${at(cx, cy, 3.4, 225)}A3.4 3.4 0 0 1 ${at(cx, cy, 3.4, 315)}Z`}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <g fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <path d={arc(cx, cy, 7.4, 225, 315)} />
        <path d={arc(cx, cy, 11.6, 225, 315)} />
      </g>
    </svg>
  );
}

export function BluetoothGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 12 20" className={cn('h-[19px] w-[12px]', className)} aria-hidden>
      <path
        d="M1.5 5.6 10 13.4 5.8 17.6V2.4L10 6.6 1.5 14.4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Rings open at the bottom around a dot. Off, a slash crosses them, with a
 * gap cut either side of it so it reads as a separate stroke on top.
 */
export function AirDropGlyph({ className, off }: GlyphProps & { off?: boolean }) {
  const id = React.useId();
  const c = 12;
  return (
    <svg viewBox="0 0 24 24" className={cn('size-[20px]', className)} aria-hidden>
      {off && (
        <mask id={id}>
          <rect width="24" height="24" fill="white" />
          <path d="M4 4 20 20" stroke="black" strokeWidth={4.6} strokeLinecap="round" />
        </mask>
      )}
      <g mask={off ? `url(#${id})` : undefined}>
        <circle cx={c} cy={c} r={1.6} fill="currentColor" />
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
          <path d={arc(c, c, 4.6, 130, 50)} />
          <path d={arc(c, c, 7.6, 125, 55)} />
          <path d={arc(c, c, 10.4, 120, 60)} />
        </g>
      </g>
      {off && <path d="M4 4 20 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />}
    </svg>
  );
}

export function MoonGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 18 18" className={cn('size-[18px]', className)} aria-hidden>
      <path d="M7.2 1.2a7 7 0 0 0 9.6 9.6A8.2 8.2 0 1 1 7.2 1.2Z" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Single-cell glyphs — drawn straight on a 62px module                        */
/* -------------------------------------------------------------------------- */

/** The strip of recent windows down the side, and the window in front. */
export function StageManagerGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 28 19" className={cn('h-[19px] w-[28px]', className)} aria-hidden>
      <g fill="currentColor">
        <rect x="0.5" y="0.5" width="3.6" height="3.6" rx="1" />
        <rect x="0.5" y="7.7" width="3.6" height="3.6" rx="1" />
        <rect x="0.5" y="14.9" width="3.6" height="3.6" rx="1" />
      </g>
      <rect x="9" y="1.5" width="18" height="16" rx="3.6" fill="none" stroke="currentColor" strokeWidth={2} opacity={0.55} />
    </svg>
  );
}

/** Two windows, the one behind cut away where the front one overlaps it. */
export function MirroringGlyph({ className }: GlyphProps) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 28 22" className={cn('h-[22px] w-[28px]', className)} aria-hidden>
      <mask id={id}>
        <rect width="28" height="22" fill="white" />
        <rect x="4.2" y="3.4" width="25" height="20" rx="5" fill="black" />
      </mask>
      <g fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="1" y="1" width="20" height="15" rx="3.4" mask={`url(#${id})`} />
        <rect x="7" y="6" width="20" height="15" rx="3.4" />
      </g>
    </svg>
  );
}

/** A ring with its left half filled. */
export function AppearanceGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 22 22" className={cn('size-[22px]', className)} aria-hidden>
      <circle cx="11" cy="11" r="9.6" fill="none" stroke="currentColor" strokeWidth={2.2} />
      <path d="M11 1.4a9.6 9.6 0 0 0 0 19.2Z" fill="currentColor" />
    </svg>
  );
}

/** A window, dimmed, with the bar along its bottom solid. */
export function MenuBarGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 26 21" className={cn('h-[21px] w-[26px]', className)} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth={2} opacity={0.55}>
        <rect x="1" y="1" width="24" height="19" rx="4" />
        <path d="M1.5 6h23" />
      </g>
      <rect x="5.5" y="12.4" width="15" height="4" rx="1.2" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Slider glyphs                                                               */
/* -------------------------------------------------------------------------- */

const RAYS = Array.from({ length: 8 }, (_, i) => i * 45);

/** A solid sun with dots for rays — the dim end of the Display slider. */
export function SunLowGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 15 15" className={cn('size-[15px]', className)} aria-hidden>
      <circle cx="7.5" cy="7.5" r="3.9" fill="currentColor" />
      {RAYS.map((deg) => {
        const [x, y] = at(7.5, 7.5, 6.4, deg).split(' ');
        return <circle key={deg} cx={x} cy={y} r={0.95} fill="currentColor" />;
      })}
    </svg>
  );
}

/** The same sun with short strokes for rays — the bright end. */
export function SunHighGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 19 19" className={cn('size-[19px]', className)} aria-hidden>
      <circle cx="9.5" cy="9.5" r="4.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
        {RAYS.map((deg) => (
          <path key={deg} d={`M${at(9.5, 9.5, 6.7, deg)}L${at(9.5, 9.5, 8.4, deg)}`} />
        ))}
      </g>
    </svg>
  );
}

/** Body and cone, one solid shape. */
const SPEAKER =
  'M1.4 4.4h2.3L8 .8c.6-.5 1.5-.1 1.5.7v11c0 .8-.9 1.2-1.5.7L3.7 9.6H1.4C.6 9.6 0 9 0 8.2V5.8c0-.8.6-1.4 1.4-1.4Z';

export function SpeakerLowGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 9.5 14" className={cn('h-[14px] w-[9.5px]', className)} aria-hidden>
      <path d={SPEAKER} fill="currentColor" />
    </svg>
  );
}

export function SpeakerHighGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 20 14" className={cn('h-[14px] w-[20px]', className)} aria-hidden>
      <path d={SPEAKER} fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
        <path d={arc(9.4, 7, 2.6, -48, 48)} />
        <path d={arc(9.4, 7, 5.6, -50, 50)} />
        <path d={arc(9.4, 7, 8.6, -50, 50)} />
      </g>
    </svg>
  );
}

/** AirPlay for audio: rings over a solid triangle, the rings cut around it. */
export function AirPlayAudioGlyph({ className }: GlyphProps) {
  const id = React.useId();
  const triangle = 'M12 12.6 17.4 20.6H6.6Z';
  return (
    <svg viewBox="0 0 24 24" className={cn('size-[17px]', className)} aria-hidden>
      <mask id={id}>
        <rect width="24" height="24" fill="white" />
        <path d={triangle} stroke="black" strokeWidth={4} strokeLinejoin="round" />
      </mask>
      <g fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" mask={`url(#${id})`}>
        <path d={arc(12, 11, 2.8, 130, 50)} />
        <path d={arc(12, 11, 6, 125, 55)} />
        <path d={arc(12, 11, 9.2, 125, 55)} />
      </g>
      <path d={triangle} fill="currentColor" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Transport                                                                   */
/* -------------------------------------------------------------------------- */

/** Rounded triangles: the system's are softened at every point. */
const ROUND = { stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' } as const;

export function BackwardGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 23 13" className={cn('h-[13px] w-[23px]', className)} aria-hidden>
      <path d="M1 6.5 11 1.2v10.6ZM11.5 6.5 21.5 1.2v10.6Z" fill="currentColor" {...ROUND} />
    </svg>
  );
}

export function ForwardGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 23 13" className={cn('h-[13px] w-[23px]', className)} aria-hidden>
      <path d="M22 6.5 12 1.2v10.6ZM11.5 6.5 1.5 1.2v10.6Z" fill="currentColor" {...ROUND} />
    </svg>
  );
}

export function PlayGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 18 20" className={cn('h-[20px] w-[18px]', className)} aria-hidden>
      <path d="M1.3 1.2 17 10 1.3 18.8Z" fill="currentColor" {...ROUND} />
    </svg>
  );
}

export function PauseGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 18 20" className={cn('h-[20px] w-[18px]', className)} aria-hidden>
      <rect x="2" y="1" width="5" height="18" rx="1.4" fill="currentColor" />
      <rect x="11" y="1" width="5" height="18" rx="1.4" fill="currentColor" />
    </svg>
  );
}
