'use client';

import * as React from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';

import {
  buildLensMaps,
  createSpringLoop,
  CONVEX,
  LensFilter,
  lerp,
  spring,
  supportsRefraction,
  type LensMaps,
} from '@/lib/lens';
import { cn } from '@/lib/utils';

/**
 * liqui Slider — the thumb is a lens over the rail it rides.
 *
 * Same construction as [Switch](./switch.tsx): a purpose-built lens rather
 * than a `LiquiGlass` surface, sharing only the kernel in `@/lib/lens`. The
 * differences between them are the interesting part, and they are not
 * cosmetic.
 *
 * A switch thumb has nothing worth magnifying under it, so it uses a lip
 * bezel: a raised rim around a flat window that reads *zoomed out*. A slider
 * thumb is sitting on the one thing in the control you actually want to look
 * at — the rail, and the fill that says where the value is — so it uses a
 * plain convex dome instead, and magnifies it. Drag one and the rail visibly
 * fattens as it passes behind the glass.
 *
 * The other difference is how hard the edge bends. The band here is a narrow
 * ring, and inside it the outermost pixels sample from *more than a thumb
 * height away*. That is what turns the rail's straight edge into the curled
 * lip of a real piece of thick glass instead of a soft smear.
 */

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Rail height. **The only number here you should change** — everything below
 * is a ratio off it, measured from the reference this component reproduces,
 * where a 330×14 rail carries a 90×60 capsule drawn at 0.6.
 *
 * The thumb is deliberately enormous next to the rail: four times its height
 * even at rest. A lens the size of the thing it sits on has nothing to show.
 */
const RAIL_H = 14;
const K = RAIL_H / 14;

/** The lens's own box. It is drawn at `REST_SCALE`, and only reaches 1 held. */
const LENS_W = Math.round(90 * K);
const LENS_H = Math.round(60 * K);
const LENS_R = LENS_H / 2;

const REST_SCALE = 0.6;
const PRESS_SCALE = 1;

/**
 * The thumb's *positioning* box: the lens at rest.
 *
 * Base UI insets the thumb from the ends of the track by half its own width,
 * so this has to be the size the thumb actually looks — not the lens box it
 * grows into. At value 0 the drawn thumb's left edge then lands exactly on the
 * rail's, and the lens overflows symmetrically out of this box when pressed.
 */
const REST_W = Math.round(LENS_W * REST_SCALE);
const REST_H = Math.round(LENS_H * REST_SCALE);

/** Published on the root so the parts can size themselves in CSS. */
const GEOMETRY_VARS = {
  '--lq-rail-h': `${RAIL_H}px`,
  '--lq-knob-w': `${REST_W}px`,
  '--lq-knob-h': `${REST_H}px`,
  '--lq-knob-pad': `${(REST_H - RAIL_H) / 2}px`,
} as React.CSSProperties;

/* -------------------------------------------------------------------------- */
/* Optics                                                                      */
/* -------------------------------------------------------------------------- */

/** Width of the sculpted band, measured inward from the lens's edge. */
const BEZEL = 0.417 * LENS_R;

/**
 * Displacement at the lens's very edge, at ratio 1 — 118% of the lens's own
 * height. It is meant to look extreme: the outer ring of pixels samples from
 * beyond the far side of the thumb, and that is the whole difference between
 * glass with thickness and a blurry circle.
 */
const PEAK = 1.178 * LENS_H;
/** Ratio of `PEAK` the lens runs at, released and held. */
const REST_RATIO = 0.4;
const PRESS_RATIO = 0.9;

const BLUR = 0;
const SPECULAR_OPACITY = 0.4;
const SPECULAR_SATURATION = 7;

const REST_FILL = 1;
const PRESS_FILL = 0.1;
/** Without a lens to uncover, thinning the fill would just delete the thumb. */
const PRESS_FILL_NO_LENS = 0.72;

/* -------------------------------------------------------------------------- */
/* Parts                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The root also publishes the geometry as custom properties.
 *
 * The parts below could take their sizes from inline styles — and did, until
 * that silently ate every `className="h-2"` a caller had written, because an
 * inline style beats a class no matter how specific. Going through variables
 * keeps `RAIL_H` as the single knob *and* leaves the classes overridable in
 * the normal way.
 */
export function Slider({ className, style, ...props }: BaseSlider.Root.Props) {
  return (
    <BaseSlider.Root
      {...props}
      style={{ ...GEOMETRY_VARS, ...(style as React.CSSProperties) }}
      className={cn('flex w-full flex-col gap-1', className)}
    />
  );
}

export function SliderLabel({ className, ...props }: BaseSlider.Label.Props) {
  return (
    <BaseSlider.Label
      {...props}
      className={cn('text-[12.5px] font-semibold text-[var(--lq-text)]', className)}
    />
  );
}

export function SliderValue({ className, ...props }: BaseSlider.Value.Props) {
  return (
    <BaseSlider.Value
      {...props}
      className={cn('text-[12.5px] tabular-nums text-[var(--lq-text-dim)]', className)}
    />
  );
}

/**
 * The hit area. Its padding is sized so the box is exactly as tall as the
 * thumb at rest — the thumb grows past it under your finger, and nothing
 * reserves room for that, because reserving room for a transient would leave a
 * permanent gap above and below every slider on the page.
 */
export function SliderControl({ className, ...props }: BaseSlider.Control.Props) {
  return (
    <BaseSlider.Control
      {...props}
      className={cn(
        'flex w-full touch-none select-none items-center py-[var(--lq-knob-pad)]',
        className,
      )}
    />
  );
}

/**
 * The rail. Deliberately not a glass surface — it is the thumb's backdrop, and
 * a lens stacked on a lens samples its parent's output instead of the page.
 *
 * Flat, and with no inset groove: whatever depth the control has comes from
 * the thumb, and a rail with its own shadow just competes with the lens
 * passing over it. The neutral grey is fixed rather than mixed from
 * `--lq-text` so the rail reads the same on a white sheet and a dark
 * wallpaper; override `--lq-slider-rail` if your theme wants otherwise.
 */
export function SliderTrack({ children, className, ...props }: BaseSlider.Track.Props) {
  return (
    <BaseSlider.Track
      {...props}
      className={cn(
        'h-[var(--lq-rail-h)] w-full select-none rounded-full',
        'bg-[var(--lq-slider-rail,rgba(137,137,143,0.4))]',
        className,
      )}
    >
      <BaseSlider.Indicator className="rounded-full bg-[var(--lq-accent)]" />
      {children}
    </BaseSlider.Track>
  );
}

export interface SliderThumbProps extends BaseSlider.Thumb.Props {
  /**
   * Set `false` to drop the lens and keep a plain white knob.
   *
   * There is one place refraction is not worth its cost: a slider sitting *on*
   * another glass surface — inside a popover, a drawer, a media-player panel.
   * `backdrop-filter` samples what is painted behind the element, and behind a
   * thumb on a frosted panel is the panel's own tint: a flat wash with nothing
   * in it to bend. Without the lens the thumb takes its size from `className`,
   * so a panel can ask for a small knob.
   */
  lens?: boolean;
}

export function SliderThumb({ lens = true, className, style, ...props }: SliderThumbProps) {
  const filterId = `lq-slider-${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const thumbRef = React.useRef<HTMLDivElement | null>(null);
  const lensRef = React.useRef<HTMLSpanElement | null>(null);
  const scaleRef = React.useRef<SVGFEDisplacementMapElement | null>(null);
  const hasLens = React.useRef(false);

  const [maps, setMaps] = React.useState<LensMaps | null>(null);

  // A plain effect, not a layout effect: at rest the fill is opaque and the
  // lens is invisible, so there is nothing to flash and no reason to make first
  // paint wait on two canvas renders and a pair of PNG encodes.
  React.useEffect(() => {
    if (!lens || !supportsRefraction()) return;
    hasLens.current = true;
    setMaps(
      buildLensMaps({
        width: LENS_W,
        height: LENS_H,
        radius: LENS_R,
        bezel: BEZEL,
        surface: CONVEX,
        dpr: Math.min(window.devicePixelRatio || 1, 3),
      }),
    );
  }, [lens]);

  /** Barely underdamped (ζ ≈ 0.89), so the grab has some life in it. */
  const press = React.useRef(spring(2000, 80)).current;

  const paint = React.useCallback(() => {
    const t = press.value;
    if (lensRef.current) {
      lensRef.current.style.scale = `${lerp(REST_SCALE, PRESS_SCALE, t)}`;
      const floor = hasLens.current ? PRESS_FILL : PRESS_FILL_NO_LENS;
      lensRef.current.style.backgroundColor = `rgba(255,255,255,${lerp(REST_FILL, floor, t)})`;
    }
    if (scaleRef.current) {
      scaleRef.current.setAttribute('scale', `${PEAK * lerp(REST_RATIO, PRESS_RATIO, t)}`);
    }
  }, [press]);

  const paintRef = React.useRef(paint);
  paintRef.current = paint;
  const loopRef = React.useRef<ReturnType<typeof createSpringLoop> | null>(null);
  loopRef.current ??= createSpringLoop([press], () => paintRef.current());
  const loop = loopRef.current;

  /**
   * Grabbed-ness comes from Base UI's own `data-dragging`, watched on the
   * element it is written to.
   *
   * It is tempting to bind pointer events here instead, and it would be worse:
   * Base UI already starts a drag when you press the *rail* — the thumb jumps
   * to your finger and follows it — and a thumb listening only to its own
   * pointer events would sit there un-grabbed through the whole gesture.
   */
  React.useEffect(() => {
    const node = thumbRef.current;
    if (!node) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    loop.reduced = motion.matches;
    const onMotion = () => (loop.reduced = motion.matches);
    motion.addEventListener('change', onMotion);

    paint();
    const observer = new MutationObserver(() =>
      loop.settle(press, node.hasAttribute('data-dragging') ? 1 : 0),
    );
    observer.observe(node, { attributes: true, attributeFilter: ['data-dragging'] });
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', onMotion);
      loop.stop();
    };
  }, [loop, paint, press]);

  // Branching on the prop, not on whether the maps have arrived: a thumb that
  // swapped structure the moment a canvas finished would rebuild Base UI's
  // input mid-interaction. With a lens the box is fixed — the map is baked for
  // exactly that size, so it is not a caller's to change — and only the
  // `backdropFilter` waits.
  if (!lens) {
    return (
      <BaseSlider.Thumb
        {...props}
        ref={thumbRef}
        style={style}
        className={cn(
          'select-none rounded-full bg-white',
          'shadow-[0_3px_14px_rgba(0,0,0,0.1),0_1px_1px_rgba(10,15,40,0.10)]',
          'outline-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px]',
          'has-[:focus-visible]:outline-[color-mix(in_srgb,var(--lq-accent)_70%,transparent)]',
          'data-[disabled]:opacity-50',
          // Through the variables the root publishes, so this still follows
          // RAIL_H and a caller can still override it with a size class.
          'h-[var(--lq-knob-h)] w-[var(--lq-knob-w)]',
          className,
        )}
      />
    );
  }

  return (
    <BaseSlider.Thumb
      {...props}
      ref={thumbRef}
      style={{ width: REST_W, height: REST_H, ...style }}
      className={cn(
        'select-none rounded-full',
        'outline-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px]',
        'has-[:focus-visible]:outline-[color-mix(in_srgb,var(--lq-accent)_70%,transparent)]',
        'data-[disabled]:opacity-50',
        className,
      )}
    >
      {maps && (
        <LensFilter
          id={filterId}
          maps={maps}
          width={LENS_W}
          height={LENS_H}
          scale={PEAK * REST_RATIO}
          blur={BLUR}
          specularOpacity={SPECULAR_OPACITY}
          specularSaturation={SPECULAR_SATURATION}
          scaleRef={scaleRef}
        />
      )}
      {/*
        The lens, centred on the positioning box above and drawn at 0.6, so it
        fills it exactly at rest and overflows it evenly when grabbed. Its
        white fill is the element's own background, which paints *above* the
        backdrop — opaque and the thumb is a white knob, a tenth and it is a
        lens with the rail running through it.
      */}
      <span
        ref={lensRef}
        aria-hidden
        style={{
          position: 'absolute',
          width: LENS_W,
          height: LENS_H,
          borderRadius: LENS_R,
          left: (REST_W - LENS_W) / 2,
          top: (REST_H - LENS_H) / 2,
          scale: REST_SCALE,
          backgroundColor: `rgba(255,255,255,${REST_FILL})`,
          boxShadow: '0 3px 14px rgba(0,0,0,0.1)',
          ...(maps
            ? { backdropFilter: `url(#${filterId})`, WebkitBackdropFilter: `url(#${filterId})` }
            : null),
        }}
      />
    </BaseSlider.Thumb>
  );
}
