'use client';

import * as React from 'react';

/**
 * The liqui lens kernel — refraction for a single small control.
 *
 * This is not `@liqui-design/glass`, and it is not trying to be. That package
 * is a *surface*: one shared displacement map and one shared filter, sized for
 * panels and popovers, tuned so a drawer and a scrollbar thumb can both live
 * off the same dials. A switch thumb and a slider thumb cannot. They need
 * their own profile, refraction that moves under your finger, and a specular
 * that carries colour rather than white — none of which a shared surface
 * should be made to grow.
 *
 * So this file is the part those controls genuinely have in common: solving a
 * glass profile, painting it into a pair of maps, the filter chain that reads
 * them, and a spring integrator to drive it. Everything that makes a switch
 * look like a switch and a slider look like a slider stays in those files —
 * the surface, the geometry, and every number.
 *
 * Chromium only, like all refraction on the web: `backdrop-filter: url(#…)` is
 * unimplemented elsewhere. Call `supportsRefraction()` and fall back.
 */

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export interface LensSurface {
  /** Stable id — keys the profile and map caches. */
  id: string;
  /** Height of the glass over normalized depth `t` from the outer edge. */
  height: (t: number) => number;
  /**
   * Thickness of the relief, and of the flat slab of glass beneath it. Only
   * the ratio matters; the profile is normalized afterwards.
   *
   * The slab is not decoration. A level patch of surface with no glass under
   * it refracts nothing at all, so a profile that flattens anywhere — every
   * one of these does, in the middle — needs it to keep bending light there.
   */
  relief: number;
  slab: number;
}

/**
 * A quarter superellipse rising from 0 to 1: `p = 2` is a circle, `p = 4` the
 * squircle. The exponent is the tail — it sets how fast the surface flattens
 * as it leaves the rim, and therefore how far the bend reaches inward.
 */
const superellipse = (p: number) => (t: number) => Math.pow(1 - Math.pow(1 - t, p), 1 / p);
const squircle = superellipse(4);
const circle = (t: number) => Math.sqrt(1 - (1 - t) * (1 - t));
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/**
 * A raised rim around a shallow dish: `squircle(2t)` rises to 1 by the middle
 * of the band and falls away again — the crest — crossfaded by smootherstep
 * into the bowl `1 − circle(t)`, lifted so the middle never thins to nothing.
 *
 * Its two halves refract in opposite directions, which is the whole point: the
 * crest pulls the backdrop inward the way any lens edge does, the bowl pushes
 * it back out, and the middle reads *zoomed out* rather than magnified.
 */
export const LIP: LensSurface = {
  id: 'lip',
  height: (t) => {
    const k = smootherstep(t);
    return squircle(t * 2) * (1 - k) + (1 - circle(t) + 0.1) * k;
  },
  // Fitted against the reference's own map: this pair reproduces its measured
  // curve to 0.26px RMS against a 29px peak. The exponents above turned out to
  // be exactly right on the first guess; these two were not, and were carrying
  // most of the error.
  relief: 2.776,
  slab: 6.776,
};

/**
 * A plain dome, and the one to reach for when the control has something worth
 * magnifying underneath — a slider's own fill, read through its thumb.
 *
 * The exponent is fitted, and it is not either of the obvious choices. A
 * squircle (p = 4) flattens too abruptly as it leaves the rim: its slope
 * collapses, the bend dies within a few pixels, and the reference's long
 * inward reach — still displacing a pixel of backdrop twelve pixels in — is
 * simply not reachable with it. A circle (p = 2) misses the other end, at the
 * rim. p = 3.25 with this slab reproduces the measured curve to 0.5px RMS
 * against a 70px peak; the squircle manages 1.8px.
 */
export const CONVEX: LensSurface = {
  id: 'convex',
  height: superellipse(3.25),
  relief: 1.608,
  slab: 5.945,
};

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

const PROFILE_SIZE = 128;
const IOR = 1.5;
const profileCache = new Map<string, { shift: Float32Array }>();

/**
 * Lateral shift per unit depth, sampled once along one radius and reused all
 * the way around the shape — the profile is the same on every side.
 *
 * Vector refraction, not an approximation of it: the surface normal comes from
 * the slope of `height`, the ray is bent through it by Snell's law at n = 1.5,
 * and then followed until it has crossed the glass.
 *
 * Normalized against the *edge*, not the maximum. The surface is vertical
 * where it meets the rim, so the solution spikes above the edge value for a
 * sample or two just inside it — a sub-pixel feature at any size a control is
 * drawn at, and normalizing by it would quietly scale the entire lens down by
 * whatever that spike happened to reach.
 */
function lensProfile(surface: LensSurface): Float32Array {
  const cached = profileCache.get(surface.id);
  if (cached) return cached.shift;

  const shift = new Float32Array(PROFILE_SIZE);
  const a = 1 / IOR;
  for (let i = 0; i < PROFILE_SIZE; i++) {
    const t = i / PROFILE_SIZE;
    const h = 1e-4;
    const height = surface.height(t);
    const slope = (surface.height(t + h) - height) / h;
    const len = Math.hypot(slope, 1);
    const nx = -slope / len;
    const ny = -1 / len;
    const inside = 1 - a * a * (1 - ny * ny);
    if (inside < 0) continue; // total internal reflection; no ray to follow
    const k = a * ny + Math.sqrt(inside);
    const dirX = -k * nx;
    const dirY = a - k * ny;
    const depth = height * surface.relief + surface.slab;
    shift[i] = dirY !== 0 ? dirX * (depth / dirY) : 0;
  }
  const edge = Math.abs(shift[0]) || 1;
  for (let i = 0; i < PROFILE_SIZE; i++) {
    shift[i] = Math.max(-1, Math.min(1, shift[i] / edge));
  }
  profileCache.set(surface.id, { shift });
  return shift;
}

/* -------------------------------------------------------------------------- */
/* Maps                                                                        */
/* -------------------------------------------------------------------------- */

export interface LensMaps {
  displacement: string;
  specular: string;
}

/** Direction the rim light comes from: upper right, falling off as cos². */
const LIGHT_ANGLE = (-60 * Math.PI) / 180;

const mapCache = new Map<string, LensMaps>();

export interface LensMapOptions {
  /** The lens element's own box, in CSS px. */
  width: number;
  height: number;
  /** Corner radius. Equal to `height / 2` for a capsule. */
  radius: number;
  /** Width of the sculpted band, in CSS px, measured inward from the edge. */
  bezel: number;
  surface: LensSurface;
  /** Device pixel ratio to render at. Clamp it yourself; 3 is plenty. */
  dpr: number;
}

/**
 * The displacement and specular maps, drawn per pixel onto a canvas and handed
 * to the filter as PNGs.
 *
 * Cached module-wide on geometry, so a page full of the same control pays for
 * one pair. Rendered at device resolution and drawn back at CSS size, because
 * the band is only a handful of CSS pixels wide and describing it with a
 * handful of samples looks like exactly that.
 *
 * A canvas rather than an SVG data URI on purpose: `feImage` rasterizes SVG
 * with a reduced feature set and silently drops the compositing a
 * gradient-built map would need.
 */
export function buildLensMaps(options: LensMapOptions): LensMaps {
  const { width, height, radius, bezel, surface, dpr } = options;
  const key = `${surface.id}|${width}x${height}r${radius}b${bezel.toFixed(3)}@${dpr}`;
  const hit = mapCache.get(key);
  if (hit) return hit;

  const W = Math.round(width * dpr);
  const H = Math.round(height * dpr);
  const R = radius * dpr;
  const B = bezel * dpr;
  const innerW = W - R * 2; // straight run between the two caps
  const innerH = H - R * 2;
  const shift = lensProfile(surface);

  const disp = new ImageData(W, H);
  const spec = new ImageData(W, H);
  // Neutral everywhere first. Only the band gets written, and everything it
  // does not touch has to read as "do not move this pixel".
  new Uint32Array(disp.data.buffer).fill(0xff008080); // little-endian RGBA 128,128,0,255

  const rSq = R * R;
  const outerSq = (R + 1) * (R + 1);
  const innerSq = (R - B) * (R - B);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Offset from the nearest corner-circle centre — zero along the straight
      // edges, which is what turns one radial profile into a rounded-rect band.
      const lx = x < R ? x - R : x >= W - R ? x - R - innerW : 0;
      const ly = y < R ? y - R : y >= H - R ? y - R - innerH : 0;
      const sq = lx * lx + ly * ly;
      if (sq > outerSq || sq < innerSq) continue;

      const dist = Math.sqrt(sq) || 1e-6;
      const depth = R - dist;
      const nx = lx / dist;
      const ny = ly / dist;
      // Coverage of the outermost pixel, so the band antialiases into the
      // border-radius clip rather than stair-stepping against it.
      const aa = sq < rSq ? 1 : 1 - (dist - R);

      const i = (y * W + x) * 4;
      const mag = shift[Math.min(((depth / B) * PROFILE_SIZE) | 0, PROFILE_SIZE - 1)] ?? 0;
      disp.data[i] = 128 - nx * mag * 127 * aa;
      disp.data[i + 1] = 128 - ny * mag * 127 * aa;
      disp.data[i + 2] = 0;
      disp.data[i + 3] = 255;

      // The rim light: one axis of light, cos² around the outward normal, laid
      // on a hairline just inside the edge — not a broad arc over the band.
      //
      // Modelling it as a lit surface instead is the obvious move and it is
      // wrong. A flat patch of glass faces the viewer, and a viewer-facing
      // normal still scores well against a light tilted toward the camera, so
      // the whole middle of the control picks up a fifth of full highlight.
      // This is also the mask for the saturation pass, so that arrives as a
      // vivid film over the entire lens.
      const theta = Math.atan2(ny, nx);
      const lit = Math.cos(theta - LIGHT_ANGLE) ** 2;
      const across = Math.abs(depth / dpr - 0.5);
      const rim = across >= 1 ? 0 : Math.cos((Math.PI / 2) * across);
      const value = lit * rim * aa;
      // Colour tracks √intensity while alpha tracks intensity, so a weak part
      // of the rim reads as dimmer light rather than as thinner white.
      spec.data[i] = spec.data[i + 1] = spec.data[i + 2] = Math.sqrt(value) * 255;
      spec.data[i + 3] = value * 255;
    }
  }

  const maps = { displacement: toPng(disp), specular: toPng(spec) };
  mapCache.set(key, maps);
  return maps;
}

function toPng(image: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d')!.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

/* -------------------------------------------------------------------------- */
/* Filter                                                                      */
/* -------------------------------------------------------------------------- */

export interface LensFilterProps {
  id: string;
  maps: LensMaps;
  /** The lens element's box, in CSS px — where the maps are laid down. */
  width: number;
  height: number;
  /** `feDisplacementMap` scale for the first paint. Animate it via `scaleRef`. */
  scale: number;
  blur: number;
  specularOpacity: number;
  specularSaturation: number;
  scaleRef?: React.Ref<SVGFEDisplacementMapElement>;
}

/**
 * The chain, in order: soften the backdrop a hair so the displacement has no
 * aliasing to amplify; bend it through the map; take a saturated copy of the
 * bend and keep only what the rim mask covers; blend that coloured rim over
 * the plain refraction; lay faded white light on top.
 *
 * The saturated copy is why the specular is composited here rather than
 * stacked as a DOM layer. A white rim reads as plastic. A rim that is the
 * backdrop's own colour pushed until it sings reads as a wet edge.
 *
 * The filter deliberately declares no region. The default is the bounding box
 * plus 10%, and the optics need it: a profile with a concave stretch samples
 * outward, past the element's own edge, and a region pinned to the element
 * would have Chromium clamp those samples into a smeared ring.
 */
export function LensFilter({
  id,
  maps,
  width,
  height,
  scale,
  blur,
  specularOpacity,
  specularSaturation,
  scaleRef,
}: LensFilterProps) {
  return (
    <svg aria-hidden className="pointer-events-none absolute size-0" focusable="false">
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="softened" />
          <feImage href={maps.displacement} x={0} y={0} width={width} height={height} result="map" />
          <feDisplacementMap
            ref={scaleRef}
            in="softened"
            in2="map"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
            result="bent"
          />
          <feColorMatrix in="bent" type="saturate" values={`${specularSaturation}`} result="vivid" />
          <feImage href={maps.specular} x={0} y={0} width={width} height={height} result="rim" />
          <feComposite in="vivid" in2="rim" operator="in" result="colouredRim" />
          <feComponentTransfer in="rim" result="whiteRim">
            <feFuncA type="linear" slope={specularOpacity} />
          </feComponentTransfer>
          <feBlend in="colouredRim" in2="bent" result="withColour" />
          <feBlend in="whiteRim" in2="withColour" />
        </filter>
      </defs>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Springs                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A spring, integrated per frame and written straight to the DOM.
 *
 * CSS cannot do this job. A press spring drives an SVG attribute
 * (`feDisplacementMap scale`) that CSS cannot animate at all, a travel spring
 * has to be interruptible mid-flight by a drag, and going through React would
 * re-render the control sixty times a second to move one element.
 */
export interface Spring {
  value: number;
  velocity: number;
  target: number;
  stiffness: number;
  damping: number;
  /**
   * Skip integration and never report settled — the value is being written
   * from outside, by a finger. A held spring keeps the loop awake so the rest
   * of the frame still paints.
   */
  held?: boolean;
}

export const spring = (stiffness: number, damping: number, value = 0): Spring => ({
  value,
  velocity: 0,
  target: value,
  stiffness,
  damping,
});

/** Sub-stepped, so a dropped frame cannot blow up a stiff spring. Returns settled. */
export function advance(s: Spring, dt: number): boolean {
  const steps = Math.min(Math.ceil(dt / (1 / 240)), 16);
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    s.velocity += (s.stiffness * (s.target - s.value) - s.damping * s.velocity) * h;
    s.value += s.velocity * h;
  }
  return Math.abs(s.target - s.value) < 0.0005 && Math.abs(s.velocity) < 0.005;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface SpringLoop {
  /** Move one spring toward a target, waking the loop if it is asleep. */
  settle(s: Spring, target: number): void;
  /** Wake the loop after writing a value directly — mid-drag, say. */
  wake(): void;
  /** Put every spring on its target and paint once. */
  snap(): void;
  stop(): void;
  /** When true, `settle` jumps instead of animating. */
  reduced: boolean;
}

/**
 * Drives a set of springs off one `requestAnimationFrame` and stops itself
 * when they all arrive.
 *
 * The loop is shared rather than written per component because the awkward
 * parts are the same everywhere and are easy to get subtly wrong: every spring
 * has to be advanced on a frame even once one of them has settled (bail early
 * and the others freeze mid-flight), a held spring has to keep the loop awake
 * without being integrated, and `dt` has to be clamped — a backgrounded tab
 * hands back one enormous delta on return, and an enormous delta is a spring
 * that explodes.
 */
export function createSpringLoop(springs: Spring[], paint: () => void): SpringLoop {
  let raf = 0;
  let last = 0;

  const loop: SpringLoop = {
    reduced: false,
    settle(s, target) {
      s.target = target;
      if (loop.reduced) {
        s.value = target;
        s.velocity = 0;
        paint();
        return;
      }
      loop.wake();
    },
    wake() {
      if (raf) return;
      last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 1 / 15);
        last = now;
        let settled = true;
        // `&& settled` on the right, so every spring is advanced every frame.
        for (const s of springs) settled = (s.held ? false : advance(s, dt)) && settled;
        paint();
        raf = settled ? 0 : requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    },
    snap() {
      for (const s of springs) {
        s.value = s.target;
        s.velocity = 0;
      }
      paint();
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
  return loop;
}

export const supportsRefraction = () =>
  typeof window !== 'undefined' &&
  CSS.supports('backdrop-filter', 'blur(1px)') &&
  !/^((?!chrome|chromium|edg|android).)*safari/i.test(navigator.userAgent) &&
  !/firefox/i.test(navigator.userAgent);
