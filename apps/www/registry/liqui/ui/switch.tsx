'use client';

import * as React from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';

import {
  buildLensMaps,
  createSpringLoop,
  LensFilter,
  LIP,
  lerp,
  spring,
  supportsRefraction,
  type LensMaps,
} from '@/lib/lens';
import { cn } from '@/lib/utils';

/**
 * liqui Switch — a purpose-built lens, not a glass surface with a switch on it.
 *
 * The whole component is one idea: **at rest the thumb is an opaque white
 * pill, and pressing it turns that pill into glass.** Three things happen at
 * once and none of them can be a CSS transition:
 *
 * - the thumb swells 38% and breaks out of the track, top and bottom;
 * - its white fill drops to a tenth, uncovering the lens underneath;
 * - the refraction more than doubles, so the lens deepens as it is revealed.
 *
 * The optics are a lip bezel — convex at the rim, concave across a wide inner
 * band, flat in the middle. Only the band refracts. The flat middle is the
 * point: it is a window, and what it frames is the violently bent edge around
 * it. A lens that distorts everywhere just looks smeared.
 *
 * The refraction kernel lives in `@/lib/lens`, shared with Slider. Everything
 * that makes this a switch — the profile, the geometry, every number below —
 * lives here.
 */

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Track height. **The only number here you should change** — everything below
 * is a ratio off it, so the switch stays in proportion at any size, and the
 * maps regenerate to match.
 *
 * The ratios are not invented. They are measured off the reference this
 * component reproduces, where the track is 160×67 and the thumb is a 146×92
 * capsule drawn at 0.65. That proportion — a thumb far wider than the track is
 * tall, riding a track far longer than an iOS switch — is what gives the lens
 * enough glass to be worth looking through.
 */
const TRACK_H = 34;
const K = TRACK_H / 67;

const TRACK_W = Math.round(160 * K);
/** The thumb's *layout* box. It is drawn at `REST_SCALE`, never at 1. */
const THUMB_W = Math.round(146 * K);
const THUMB_H = Math.round(92 * K);
const THUMB_R = THUMB_H / 2;

const REST_SCALE = 0.65;
const PRESS_SCALE = 0.9;

/** Straight run of the track, less the straight run of the drawn thumb. */
const TRAVEL = TRACK_W - TRACK_H - (THUMB_W - THUMB_H) * REST_SCALE;
/** Left offset that lands the drawn thumb on an even inset inside the track. */
const THUMB_LEFT = (TRACK_H - THUMB_H * REST_SCALE) / 2 - (THUMB_W * (1 - REST_SCALE)) / 2;

/* -------------------------------------------------------------------------- */
/* Optics                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Width of the sculpted band, in thumb-local px, measured inward from the edge.
 *
 * At 41% of the thumb's radius it leaves the middle 59% flat and untouched —
 * a genuinely neutral window, not a weak gradient. Widening this does not make
 * the effect stronger, it makes it muddier.
 */
const BEZEL = 0.413 * THUMB_R;

/**
 * Displacement at the thumb's very edge, in thumb-local px, at ratio 1 — very
 * nearly a third of the thumb's own height. It reads as a lot because it is:
 * the outermost ring of pixels samples from a third of the way across the
 * thumb, which is what makes the track's edge appear to *wrap* around the
 * glass rather than merely blur past it.
 */
const PEAK = 0.3196 * THUMB_H;
/** Ratio of `PEAK` the lens runs at, released and held. */
const REST_RATIO = 0.4;
const PRESS_RATIO = 0.9;

const BLUR = 0.2 * K;
const SPECULAR_OPACITY = 0.5;
const SPECULAR_SATURATION = 6;

/* Press response. */
const REST_FILL = 1;
const PRESS_FILL = 0.1;
/** Without a lens to uncover, thinning the fill would just delete the thumb. */
const PRESS_FILL_NO_LENS = 0.72;
/** Pointer travel, in px, that turns a tap into a drag. */
const DRAG_SLOP = 4;
/** Stiffness of the rubber band once a drag runs past either end. */
const OVERDRAG = 22;

/* Precomputed, because the paint below runs on every frame of a drag and these
   two strings never change. The inset pair is a drag tell, not a press tell: it
   is the thumb reading as something pushed *along* rather than pushed down. */
const SHADOW = '0 4px 22px rgba(0,0,0,0.1)';
const SHADOW_DRAGGING =
  `${SHADOW}, inset ${2 * K}px ${7 * K}px ${24 * K}px rgba(0,0,0,0.09),` +
  ` inset ${-2 * K}px ${-7 * K}px ${24 * K}px rgba(255,255,255,0.09)`;

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export interface SwitchProps extends BaseSwitch.Root.Props {
  /**
   * Set `false` to drop the lens and keep the white pill.
   *
   * There is one place refraction is not worth its cost: a switch sitting *on*
   * another glass surface — inside a popover, a drawer, a media-player panel.
   * `backdrop-filter` samples what is painted behind the element, and behind a
   * switch on a frosted panel is the panel's own tint: a flat wash with
   * nothing in it to bend. The filter runs, the maps decode, and the result is
   * indistinguishable from not having done any of it.
   */
  lens?: boolean;
}

export function Switch({ className, lens = true, onPointerDown, ...props }: SwitchProps) {
  const filterId = `lq-switch-${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const rootRef = React.useRef<HTMLSpanElement | null>(null);
  const thumbRef = React.useRef<HTMLSpanElement | null>(null);
  const accentRef = React.useRef<HTMLSpanElement | null>(null);
  const scaleRef = React.useRef<SVGFEDisplacementMapElement | null>(null);
  const hasLens = React.useRef(false);

  const [maps, setMaps] = React.useState<LensMaps | null>(null);

  // Canvas is client-only and the tier check sniffs the UA, so both have to
  // happen after hydration or the server and the client disagree about what to
  // render. A plain effect, not a layout effect: at rest the fill is opaque and
  // the lens is invisible, so there is nothing to flash and no reason to make
  // first paint wait on two canvas renders and a pair of PNG encodes.
  React.useEffect(() => {
    if (!lens || !supportsRefraction()) return;
    hasLens.current = true;
    setMaps(
      buildLensMaps({
        width: THUMB_W,
        height: THUMB_H,
        radius: THUMB_R,
        bezel: BEZEL,
        surface: LIP,
        dpr: Math.min(window.devicePixelRatio || 1, 3),
      }),
    );
  }, [lens]);

  const engine = React.useRef({
    /** Thumb position, 0…1. Overdamped (ζ ≈ 1.27): arrives, never overshoots. */
    pos: spring(1000, 80),
    /** Press depth, 0…1. Barely underdamped (ζ ≈ 0.89), so it has some life. */
    press: spring(2000, 80),
    /**
     * Track colour. Its own spring because it is not the thumb's position: it
     * flips the moment a drag crosses the middle and then travels on its own,
     * rather than fading through a half-tinted track on the way across.
     */
    tint: spring(1000, 80),
    dragging: false,
    moved: 0,
    startX: 0,
    startPos: 0,
  }).current;

  const paint = React.useCallback(() => {
    const { pos, press, tint } = engine;
    const thumb = thumbRef.current;
    if (thumb) {
      thumb.style.translate = `${pos.value * TRAVEL}px -50%`;
      thumb.style.scale = `${lerp(REST_SCALE, PRESS_SCALE, press.value)}`;
      const floor = hasLens.current ? PRESS_FILL : PRESS_FILL_NO_LENS;
      thumb.style.backgroundColor = `rgba(255,255,255,${lerp(REST_FILL, floor, press.value)})`;
      thumb.style.boxShadow = engine.dragging ? SHADOW_DRAGGING : SHADOW;
    }
    if (accentRef.current) accentRef.current.style.opacity = `${tint.value}`;
    if (scaleRef.current) {
      scaleRef.current.setAttribute(
        'scale',
        `${PEAK * lerp(REST_RATIO, PRESS_RATIO, press.value)}`,
      );
    }
  }, [engine]);

  // Indirected through a ref so the loop, which is built once, never holds a
  // stale `paint`.
  const paintRef = React.useRef(paint);
  paintRef.current = paint;
  const loopRef = React.useRef<ReturnType<typeof createSpringLoop> | null>(null);
  loopRef.current ??= createSpringLoop([engine.pos, engine.press, engine.tint], () =>
    paintRef.current(),
  );
  const loop = loopRef.current;
  const settle = loop.settle;

  /**
   * The checked state is read off the DOM rather than mirrored in React.
   *
   * Base UI owns it, and it may be controlled or uncontrolled — a mirror would
   * have to guess which, and would be wrong for a controlled switch whose
   * parent declines the change. `data-checked` is the attribute the styles
   * already key on, so watching it is watching the truth.
   */
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    loop.reduced = motion.matches;
    const onMotion = () => (loop.reduced = motion.matches);
    motion.addEventListener('change', onMotion);

    const read = () => (root.hasAttribute('data-checked') ? 1 : 0);
    // No opening animation: the first frame is wherever the switch already is.
    engine.pos.value = engine.pos.target = read();
    engine.tint.value = engine.tint.target = engine.pos.value;
    paint();

    const observer = new MutationObserver(() => {
      if (engine.dragging) return;
      settle(engine.pos, read());
      settle(engine.tint, read());
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-checked'] });
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', onMotion);
      loop.stop();
    };
  }, [engine, loop, paint, settle]);

  const onPointerMove = React.useCallback(
    (event: PointerEvent) => {
      const dx = event.clientX - engine.startX;
      engine.moved = Math.max(engine.moved, Math.abs(dx));
      if (engine.moved < DRAG_SLOP) return;
      engine.dragging = true;
      engine.pos.held = true;
      // Follow the finger exactly — a spring between pointer and thumb is the
      // one place a spring reads as lag rather than life — but let it run past
      // either end on a rubber band, so the track has a floor and a ceiling you
      // can feel.
      const raw = engine.startPos + dx / TRAVEL;
      const over = raw < 0 ? -raw : raw > 1 ? raw - 1 : 0;
      engine.pos.value = Math.min(1, Math.max(0, raw)) + Math.sign(raw) * (over / OVERDRAG);
      engine.pos.velocity = 0;
      settle(engine.tint, engine.pos.value > 0.5 ? 1 : 0);
      loop.wake();
    },
    [engine, loop, settle],
  );

  const onPointerUp = React.useCallback(() => {
    const root = rootRef.current;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    settle(engine.press, 0);

    if (!engine.dragging || !root) return;
    engine.dragging = false;
    engine.pos.held = false;

    const wants = engine.pos.value > 0.5 ? 1 : 0;
    const current = root.hasAttribute('data-checked') ? 1 : 0;

    // Snap the animation back to whatever the state *actually* is, before
    // deciding anything. If the toggle below lands, the observer moves both
    // springs again; if it never happens — a controlled switch refusing the
    // change — this is already the truth. Without it a refused drag leaves the
    // track tinted for a state the switch is not in.
    settle(engine.pos, current);
    settle(engine.tint, current);

    /**
     * A drag and a tap both end in a `click`, and Base UI toggles on click. A
     * drag that lands on the far side wants exactly that toggle, so it is let
     * through; a drag that returns to the side it started on wants nothing to
     * happen, so the click is swallowed on the way up. The state is never
     * written twice, and a controlled switch still gets to refuse the change.
     */
    if (wants === current) {
      root.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, {
        capture: true,
        once: true,
      });
    }
  }, [engine, loop, onPointerMove, settle]);

  return (
    <BaseSwitch.Root
      {...props}
      ref={rootRef}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || props.disabled || props.readOnly) return;
        // Pointer capture is what makes a drag that ends off the control still
        // count. Without it the release retargets to whatever is under the
        // cursor, no `click` is dispatched on the switch, and a drag that flung
        // the thumb across simply never commits.
        event.currentTarget.setPointerCapture?.(event.pointerId);
        engine.moved = 0;
        engine.startX = event.clientX;
        engine.startPos = engine.pos.value;
        settle(engine.press, 1);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
      }}
      style={{ width: TRACK_W, height: TRACK_H, borderRadius: TRACK_H / 2 }}
      className={cn(
        'relative inline-block flex-none cursor-default touch-none select-none align-middle',
        // No overflow clip and no isolation, on purpose. The thumb swells past
        // the track under your finger, and its backdrop has to reach the page
        // rather than stop at this element.
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px]',
        'focus-visible:outline-[color-mix(in_srgb,var(--lq-accent)_70%,transparent)]',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
    >
      {/* The track is a flat fill, not a glass surface: it is the thumb's
          backdrop, and a lens stacked on a lens samples its parent's output
          instead of the page. It keeps alpha in both states so there is always
          something behind the thumb worth bending.

          A fixed mid-grey rather than a mix of `--lq-text`, and deliberately:
          the off state has to read as *off* on a white settings sheet and on a
          dark wallpaper alike, and a neutral at 47% is the one value that does
          both. Override `--lq-switch-off` if your theme wants otherwise. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-[var(--lq-switch-off,rgba(148,148,159,0.47))]"
      />
      <span
        ref={accentRef}
        aria-hidden
        style={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--lq-accent)_93%,transparent)]"
      />

      {maps && (
        <LensFilter
          id={filterId}
          maps={maps}
          width={THUMB_W}
          height={THUMB_H}
          scale={PEAK * REST_RATIO}
          blur={BLUR}
          specularOpacity={SPECULAR_OPACITY}
          specularSaturation={SPECULAR_SATURATION}
          scaleRef={scaleRef}
        />
      )}

      {/*
        The thumb is drawn at 0.65 and pressed to 0.9, so its layout box is
        half again as big as it ever looks. That is not a trick to save a
        re-layout — it is why the map has the resolution to hold up when the
        thumb swells, and why the refraction grows with it: `backdrop-filter`
        is applied in the element's own coordinates and scaled with everything
        else.

        Its white fill is the element's own background, which sits *above* the
        backdrop. That single value is the reveal: opaque and the thumb is a
        white pill, a tenth and it is the lens.
      */}
      <BaseSwitch.Thumb
        ref={thumbRef}
        className="absolute"
        style={{
          width: THUMB_W,
          height: THUMB_H,
          borderRadius: THUMB_R,
          left: THUMB_LEFT,
          top: TRACK_H / 2,
          translate: '0px -50%',
          scale: REST_SCALE,
          backgroundColor: `rgba(255,255,255,${REST_FILL})`,
          boxShadow: SHADOW,
          ...(maps
            ? { backdropFilter: `url(#${filterId})`, WebkitBackdropFilter: `url(#${filterId})` }
            : null),
        }}
      />
    </BaseSwitch.Root>
  );
}

/**
 * Settings-row wrapper: text on the left, switch pushed to the right, whole row
 * clickable. `has-*` dims the label when the switch inside is disabled.
 */
export function SwitchLabel({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn(
        'flex cursor-default select-none items-center justify-between gap-5 text-[13.5px] font-medium text-[var(--lq-text)]',
        'has-[[data-disabled]]:text-[var(--lq-text-dim)]',
        className,
      )}
    >
      {children}
    </label>
  );
}
