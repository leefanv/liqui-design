import * as React from 'react';
import { ensureFilter, prewarmImage } from './filterRegistry';
import { BackdropContext, NestedGlassContext } from './backdrop';
import { useGlassTheme } from './theme';
import './glass.css';

/**
 * Refraction (backdrop-filter: url(#svg-filter)) currently only renders in
 * Chromium. Safari silently drops the whole backdrop-filter value when an SVG
 * reference is present; Firefox ignores it too. WebKit has an implementation
 * in review (bug 245510, PRs from July 2026) — when Safari ships it, raise the
 * version gate below.
 */
const SAFARI_REFRACTION_MIN = Infinity; // TODO: set once WebKit bug 245510 ships
const FIREFOX_REFRACTION_MIN = Infinity;

const supportsRefraction = (() => {
  if (typeof window === 'undefined') return false;
  if (!CSS.supports('backdrop-filter', 'blur(1px)')) return false;
  const ua = navigator.userAgent;
  const firefox = ua.match(/firefox\/(\d+)/i);
  if (firefox) return Number(firefox[1]) >= FIREFOX_REFRACTION_MIN;
  const isSafari = /^((?!chrome|chromium|edg|android).)*safari/i.test(ua);
  if (isSafari) {
    const version = ua.match(/version\/(\d+)/i);
    return Number(version?.[1] ?? 0) >= SAFARI_REFRACTION_MIN;
  }
  return true; // Chromium
})();

export type GlassMaterial = 'auto' | 'frost' | 'clear';
export type GlassProfile = 'squircle' | 'convex' | 'rim';
/**
 * How the surface is lit and toned — orthogonal to the optics dials.
 *
 * - 'classic' — light from above and below: the top and bottom arcs catch a
 *   highlight, the flanks fall into a thin shade, and a frosted tint carries
 *   legibility.
 * - 'prism' — the look of glass type: one key light (from above by default,
 *   see `lightAngle`), so the edges facing it catch a crisp highlight and
 *   the edges facing away a dark rim; a hairline around the whole outline;
 *   a brightened, lightly tinted interior. Reads as a cut slab rather than a
 *   frosted pane, and wants a narrow bezel, a soft bend and a colour fringe
 *   at the edge (see `prismGlassTheme`).
 */
export type GlassFinish = 'classic' | 'prism';

/**
 * The lighting dials. Not prism-specific: every finish has a value for each,
 * and a finish is just a light *model* (`classic` = a dual light along one
 * axis, `prism` = a single key light) plus these defaults (`FINISH_LIGHTING`).
 * Any of them can be set on the theme or on a surface; unset ones fall back to
 * the finish's own.
 */
export interface GlassLighting {
  /**
   * Direction the light comes from, in degrees clockwise from straight up:
   * 0 = above, −45 = top left, 45 = top right. Classic lights both ends of
   * this axis; prism only the end it names.
   */
  lightAngle: number;
  /** Strength of the shade on the edges facing away from the light, 0–1. */
  edgeShade: number;
  /**
   * Opacity of a ~0.6px line around the whole outline, 0–1. Dark in the light
   * appearance and light in the dark one, so the outline never sinks into a
   * backdrop of its own tone.
   */
  hairline: number;
  /** Brightness pushed through the glass; 1 leaves the backdrop as it is. */
  brightness: number;
  /** Tint opacity left at frost 0, 0–1 — how far from truly clear the glass gets. */
  tintFloor: number;
}

export const FINISH_LIGHTING: Record<GlassFinish, GlassLighting> = {
  // Edge shade is the opacity of a one-device-pixel line, before `specular`:
  // classic's 0.8 at the default specular 0.85 darkens the flank by about
  // two thirds, a little past the system's ~55% — both finishes were settled
  // by eye on the home stage, this one at that specular.
  classic: { lightAngle: 0, edgeShade: 0.8, hairline: 0, brightness: 1, tintFloor: 0.25 },
  prism: { lightAngle: 1, edgeShade: 0.48, hairline: 0.35, brightness: 1.14, tintFloor: 0.08 },
};

/** Shade is stronger in the dark appearance, where a dim rim reads weaker. */
const DARK_SHADE = 1.25;

/**
 * Squircle corners read "less round" than circular ones at the same radius —
 * the superellipse hugs the corner and keeps its curvature away from the
 * edges — so surfaces looked tighter than the circular-corner releases at
 * identical numbers. Where the squircle actually renders, the declared
 * radius is inflated to restore the perceived corner size; elsewhere the
 * value passes through and the look matches older releases exactly. The
 * inflated radius feeds both --lq-radius and the displacement map, so clip
 * and optics stay on one geometry.
 */
const SQUIRCLE_RADIUS_SCALE = 1.4;
const supportsSquircle =
  typeof window !== 'undefined' &&
  typeof CSS !== 'undefined' &&
  CSS.supports('corner-shape', 'squircle');

/**
 * Refraction magnitude along the bezel, indexed by normalized depth from the
 * outer edge (0 = edge, 1 = inner end of the bezel). The physical profiles
 * model a glass slab whose top surface follows a height function h(t): the
 * surface slope gives the incident angle, Snell's law (n = 1.5) the bend, and
 * the remaining glass depth the lateral shift — giving the sharp peak at the
 * rim and smooth falloff of real thick glass. 'rim' is the cheap stylized
 * falloff kept for comparison.
 */
const LUT_SIZE = 128;
interface SurfaceLUTs {
  /** Refraction displacement magnitude, normalized to [0, 1]. */
  mag: Float32Array;
  /** Surface slope dh/dd × thickness — drives the 3D normal for lighting. */
  slope: Float32Array;
}
const lutCache = new Map<GlassProfile, SurfaceLUTs>();

function surfaceLUTs(profile: GlassProfile): SurfaceLUTs {
  const cached = lutCache.get(profile);
  if (cached) return cached;

  const mag = new Float32Array(LUT_SIZE);
  const slope = new Float32Array(LUT_SIZE);
  const n = 1.5; // refractive index of glass
  const T = 0.6; // slab thickness relative to bezel width
  const h =
    profile === 'squircle'
      ? (t: number) => Math.pow(1 - Math.pow(1 - t, 4), 0.25)
      : profile === 'convex'
        ? (t: number) => Math.sqrt(1 - (1 - t) * (1 - t))
        : (t: number) => 1 - (1 - t) * (1 - t); // 'rim' pseudo-height
  const eps = 1 / 1024;
  let max = 0;
  for (let i = 0; i < LUT_SIZE; i++) {
    const t = Math.max(i / (LUT_SIZE - 1), eps);
    const hi = Math.min(t + eps, 1);
    const lo = Math.max(t - eps, 0);
    slope[i] = ((h(hi) - h(lo)) / (hi - lo)) * T;
    if (profile === 'rim') {
      mag[i] = (1 - t) * (1 - t);
    } else {
      const thetaI = Math.atan(Math.abs(slope[i]));
      const delta = thetaI - Math.asin(Math.sin(thetaI) / n);
      mag[i] = h(t) * T * Math.tan(delta);
      max = Math.max(max, mag[i]);
    }
  }
  if (max > 0) for (let i = 0; i < LUT_SIZE; i++) mag[i] /= max;
  const luts = { mag, slope };
  lutCache.set(profile, luts);
  return luts;
}

/**
 * Rim lighting is derived from the surface normal: a directional light from
 * above and its counterpart from below catch the top and bottom arcs — a
 * straight edge lights evenly along its whole run — while the left/right
 * flanks keep a crisp dark line. What keeps this from reading as a bevelled
 * button is the shaping: the highlight lives in a ~1pt line hugging the
 * boundary plus a few px of glow, and the shade in a single device pixel,
 * not wide bands across the bezel.
 * (The earlier positional-azimuth model lit straight edges unevenly, which is
 * the single most visible tell against real glass.)
 */
const LIGHT_SPREAD = 1.08; // radians off vertical the top/bottom highlight reaches
const DIFFUSE_SPREAD = LIGHT_SPREAD * 0.65;
/** CSS px: depth of the solid highlight line — the system's is about 1pt. */
const HIGHLIGHT_DEPTH = 1;
/** CSS px: how far the glow under the highlight reaches, at most. */
const GLOW_REACH = 4;
/** Glow opacity just under the highlight line, classic — measured ~0.6. */
const CLASSIC_GLOW = 0.6;
/**
 * Prism's highlight gain, from the glass-type study it is drawn from
 * (titles.html 09): the lit edge runs past full strength and clips, so it
 * reads as a cut edge catching the light rather than a gradient.
 */
const PRISM_HIGHLIGHT = 1.2;

const sat = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

interface SurfaceField {
  /** Signed distance to the outline, negative inside. */
  sd: number;
  nx: number;
  ny: number;
}

/**
 * Signed distance and outward normal for the surface outline: straight edges
 * joined by superellipse corners, |x|⁴ + |y|⁴ = r⁴ — the curve CSS
 * `corner-shape: squircle` draws, so the refraction map, the baked lighting
 * and the CSS clip agree on one geometry. The corner distance is a
 * first-order estimate (field / |gradient|): exact at the curve, drifting
 * only well inside, where nothing reads absolute distance anymore.
 *
 * `round` swaps in circular corners, for capsules, discs and `corner: 'round'` — see
 * `isCapsule`. Exact distance there, since a circle has one.
 */
function surfaceField(
  px: number,
  py: number,
  bx: number,
  by: number,
  r: number,
  round: boolean,
  out: SurfaceField,
) {
  const qx = Math.abs(px) - bx;
  const qy = Math.abs(py) - by;
  if (round && qx > 0 && qy > 0) {
    const len = Math.hypot(qx, qy) || 1;
    out.sd = len - r;
    out.nx = (Math.sign(px) * qx) / len;
    out.ny = (Math.sign(py) * qy) / len;
  } else if (qx > 0 && qy > 0) {
    const x3 = qx * qx * qx;
    const y3 = qy * qy * qy;
    const q = Math.pow(qx * x3 + qy * y3, 0.25);
    const len = Math.hypot(x3, y3) || 1;
    out.sd = ((q - r) * q * q * q) / len;
    out.nx = (Math.sign(px) * x3) / len;
    out.ny = (Math.sign(py) * y3) / len;
  } else {
    const ox = Math.max(qx, 0);
    const oy = Math.max(qy, 0);
    out.sd = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
    if (qx > qy) {
      out.nx = Math.sign(px);
      out.ny = 0;
    } else {
      out.nx = 0;
      out.ny = Math.sign(py);
    }
  }
}

/**
 * Displacement map for the lens effect, generated per-pixel on a canvas.
 * R encodes horizontal displacement, B vertical; 128 is neutral. A
 * rounded-rect signed distance field gives depth + outward normal per pixel;
 * the LUT above gives the magnitude. Pixels sample toward the center
 * (convex-lens edge magnification) — sampling outward would hit Chromium's
 * backdrop edge-clamp and smear instead of refract.
 *
 * (Canvas instead of an SVG data-URI: feImage rasterizes SVG images with CSS
 * features like mix-blend-mode disabled, which silently corrupts
 * gradient-composited maps.)
 */
/**
 * Maps are cached module-wide: popups remount at identical sizes on every
 * open, so a reopen costs a Map lookup instead of a canvas render. Large
 * displacement maps render at half resolution — displacement vectors are a
 * smooth field, so feImage stretching is invisible, and generation + PNG
 * decode get ~4× cheaper (less pop-in latency). The specular always renders
 * at full resolution: its rim is a ~1px stroke, which is exactly the feature
 * stretching would soften.
 *
 * Bounded LRU: a surface that animates its box (an accordion panel expanding)
 * walks through a distinct size every frame, so an unbounded cache would grow
 * a PNG set per intermediate height and never release them.
 */
const IMAGE_CACHE_MAX = 48;
const imageCache = new Map<string, { map: string; specular: string; specularDark: string }>();

function cacheGet(key: string) {
  const hit = imageCache.get(key);
  if (!hit) return undefined;
  // Re-insert to mark most-recently-used (Map preserves insertion order).
  imageCache.delete(key);
  imageCache.set(key, hit);
  return hit;
}

function cacheSet(key: string, value: { map: string; specular: string; specularDark: string }) {
  imageCache.set(key, value);
  if (imageCache.size > IMAGE_CACHE_MAX) {
    imageCache.delete(imageCache.keys().next().value!);
  }
}

function glassImages(
  fullW: number,
  fullH: number,
  fullRadius: number,
  fullBezel: number,
  profile: GlassProfile,
  round: boolean,
  finish: GlassFinish,
  lighting: Pick<GlassLighting, 'lightAngle' | 'edgeShade' | 'hairline'>,
  /** False on a tier with no filter to feed — the frost tier wants the rim alone. */
  needMap: boolean,
) {
  const { lightAngle, edgeShade, hairline: hairlineOpacity } = lighting;
  const key =
    `${fullW}x${fullH}r${fullRadius}b${fullBezel}${profile}${round ? 'o' : 's'}` +
    `${finish}a${lightAngle}e${edgeShade}h${hairlineOpacity}` +
    `@${Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)))}${needMap ? '' : 'n'}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const scale = fullW * fullH > 32000 ? 0.5 : 1;
  const w = Math.ceil(fullW * scale);
  const h = Math.ceil(fullH * scale);
  const radius = fullRadius * scale;
  const bezel = fullBezel * scale;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(w, h);
  const data = image.data;

  const { mag: lut } = surfaceLUTs(profile);
  const field: SurfaceField = { sd: 0, nx: 0, ny: 0 };

  const r = Math.min(radius, w / 2, h / 2);
  const bx = w / 2 - r;
  const by = h / 2 - r;

  for (let y = 0; y < (needMap ? h : 0); y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - w / 2;
      const py = y + 0.5 - h / 2;
      surfaceField(px, py, bx, by, r, round, field);
      const depth = -field.sd; // distance from the edge, measured inward

      const d = depth / bezel;
      const inRim = d < 1 && d >= 0;
      const idx = inRim ? Math.min(Math.round(d * (LUT_SIZE - 1)), LUT_SIZE - 1) : 0;
      const mag = inRim ? lut[idx] : 0;

      const i = (y * w + x) * 4;
      data[i] = Math.round(128 - field.nx * mag * 127); // R → x displacement
      data[i + 1] = 128;
      data[i + 2] = Math.round(128 - field.ny * mag * 127); // B → y displacement
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  /**
   * Specular overlay, one image per appearance, drawn from the outline's
   * normal and signed distance. Measured off the system's own control center
   * (macOS 26, 2× captures, light and dark):
   *
   * - highlight — a solid white line about 1pt deep on the edges that face
   *   the light, and inside it a glow fading out over about 4pt;
   * - edge line — a crisp dark line one *device* pixel wide, right at the
   *   boundary, wherever the highlight is not: the flanks in classic, the far
   *   edges in prism. Light appearance darkens by about half there, dark
   *   almost to black. Not a soft band: a wide grey falloff is what made the
   *   edge read as a bevel rather than the cut edge of a sheet.
   * - hairline — the same one-device-pixel line all the way round, at its own
   *   opacity; dark on the light appearance, a faint light line on the dark,
   *   where a dark one vanishes into the backdrop.
   *
   * The image is baked at the device pixel ratio (up to 2×) for that reason:
   * at CSS-pixel resolution the narrowest line it can hold is a CSS pixel,
   * which the screen then draws two device pixels wide and soft.
   *
   * Dark appearance dims the highlight and deepens the shade; the two PNGs
   * are swapped by CSS (see glass.css) so the appearance change needs no JS.
   */
  const dpr = Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)));
  const specW = fullW * dpr;
  const specH = fullH * dpr;
  const specR = Math.min(fullRadius, fullW / 2, fullH / 2);
  const specBx = fullW / 2 - specR;
  const specBy = fullH / 2 - specR;

  const makeSpecCanvas = () => {
    const c = document.createElement('canvas');
    c.width = specW;
    c.height = specH;
    return c;
  };
  const lightCanvas = makeSpecCanvas();
  const darkCanvas = makeSpecCanvas();
  const lightCtx = lightCanvas.getContext('2d')!;
  const darkCtx = darkCanvas.getContext('2d')!;
  const lightImage = lightCtx.createImageData(specW, specH);
  const darkImage = darkCtx.createImageData(specW, specH);

  const cosLight = Math.cos(LIGHT_SPREAD);
  const cosDiffuse = Math.cos(DIFFUSE_SPREAD);
  // The glow under the highlight: about 4pt on a module the size of the
  // system's, less on a small control so it doesn't fill a button.
  const reach = Math.min(GLOW_REACH, Math.max(1.5, Math.min(fullW, fullH) * 0.035));
  // Half a device pixel, in CSS pixels: each sample covers ±px of distance.
  const half = 0.5 / dpr;
  const device = 1 / dpr;
  /** How much of this sample's pixel lies in the band `[-depth, 0]` of distance. */
  const band = (sd: number, depth: number) =>
    Math.max(0, Math.min(sd + half, 0) - Math.max(sd - half, -depth)) / device;

  // The light axis (toward the light) and its perpendicular, from the angle.
  const rad = (lightAngle * Math.PI) / 180;
  const lx = Math.sin(rad);
  const ly = -Math.cos(rad);

  const compose = (
    out: Uint8ClampedArray,
    i: number,
    specAmount: number,
    diffuse: number,
    shadeBase: number,
    specScale: number,
    diffuseScale: number,
    shadeStrength: number,
    glint = 0,
  ) => {
    const highlight = sat(specAmount * specScale + diffuse * diffuseScale + glint);
    const shade = sat(shadeBase * shadeStrength);
    const alpha = highlight + shade * (1 - highlight);
    if (alpha <= 0) return;
    // Light over a dark rim, unpremultiplied for the PNG encoder. The scale
    // greys the light as well as thinning it, for the dark appearance.
    const value = Math.min((specScale * highlight) / alpha, 1);
    const v = Math.round(value * 255);
    out[i] = v;
    out[i + 1] = v;
    out[i + 2] = v;
    out[i + 3] = Math.round(Math.min(alpha, 1) * 255);
  };

  for (let y = 0; y < specH; y++) {
    for (let x = 0; x < specW; x++) {
      const px = (x + 0.5) / dpr - fullW / 2;
      const py = (y + 0.5) / dpr - fullH / 2;
      surfaceField(px, py, specBx, specBy, specR, round, field);
      const sd = field.sd;
      // Everything lives within a hair of the boundary; skip the bulk early.
      if (sd > half || sd < -(reach + HIGHLIGHT_DEPTH + 1)) continue;

      const i = (y * specW + x) * 4;
      const highlightBand = band(sd, HIGHLIGHT_DEPTH);
      const line = band(sd, device);
      // Under the highlight line, fading to nothing over `reach`.
      const inner = -sd - HIGHLIGHT_DEPTH;
      const glow = inner <= 0 ? 0 : Math.pow(sat(1 - inner / reach), 1.4);
      const hairline = line * hairlineOpacity;
      const darkShade = Math.min(1, edgeShade * DARK_SHADE);

      if (finish === 'prism') {
        // One key light. The highlight follows how squarely the outward normal
        // faces it; the far edges get the line.
        const lit = field.nx * lx + field.ny * ly;
        const facing = sat(lit);
        const away = sat(-lit);
        const specAmount = sat(Math.pow(facing, 1.1) * PRISM_HIGHLIGHT) * highlightBand;
        const diffuse = Math.pow(facing, 2) * 0.12 * glow;
        const rim = Math.pow(away, 1.2) * line;
        // Light appearance: the hairline is dark, merged with the rim.
        // Dark: a dark line on dark glass over a dark backdrop vanishes —
        // the down-right edge and with it the outline disappeared — so there
        // it turns into a faint light line instead.
        compose(lightImage.data, i, specAmount, diffuse, Math.max(rim * edgeShade, hairline), 1, 1, 1);
        compose(darkImage.data, i, specAmount, diffuse, rim * darkShade, 0.9, 0.6, 1, hairline * 0.75);
        continue;
      }

      const vertical = Math.abs(field.nx * lx + field.ny * ly);
      const directional = Math.pow(sat((vertical - cosLight) / (1 - cosLight)), 1.25);
      const diffuseDir = Math.pow(sat((vertical - cosDiffuse) / (1 - cosDiffuse)), 1.25);
      const specAmount = directional * highlightBand;
      const diffuse = diffuseDir * CLASSIC_GLOW * glow;

      // The edge line runs all the way round; the highlight is composited
      // over it, so it shows where the highlight does not — the flanks, and
      // fading in round the corners as the highlight fades out.
      compose(lightImage.data, i, specAmount, diffuse, Math.max(line * edgeShade, hairline), 1, 1, 1);
      compose(darkImage.data, i, specAmount, diffuse, line * darkShade, 0.82, 0.55, 1, hairline * 0.75);
    }
  }
  lightCtx.putImageData(lightImage, 0, 0);
  darkCtx.putImageData(darkImage, 0, 0);

  const result = {
    map: needMap ? canvas.toDataURL() : '',
    specular: lightCanvas.toDataURL(),
    specularDark: darkCanvas.toDataURL(),
  };
  cacheSet(key, result);
  return result;
}

export interface LiquiGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Rendering tier — the perf/quality trade-off, exposed so apps (or their
   * users) can downgrade:
   * - 'auto'  — true refraction where supported, frosted glass elsewhere
   * - 'frost' — always frosted (blur + saturate); no SVG filter, no canvas map
   * - 'clear' — tint and rim only, no backdrop-filter at all (cheapest)
   */
  material?: GlassMaterial;
  /** Lens shape of the refracting rim. 'squircle' is the most glass-like. */
  profile?: GlassProfile;
  /** Lighting and tone of the surface — see `GlassFinish`. */
  finish?: GlassFinish;
  /** Light direction, degrees clockwise from up. Default: the finish's. */
  lightAngle?: number;
  /** Shade on the edges facing away from the light, 0–1. Default: the finish's. */
  edgeShade?: number;
  /** Outline line opacity, 0–1. Default: the finish's. */
  hairline?: number;
  /** Brightness pushed through the glass. Default: the finish's. */
  brightness?: number;
  /** Tint opacity at frost 0. Default: the finish's. */
  tintFloor?: number;
  /**
   * Corner radius of the glass surface in px.
   *
   * This and the three below are the *geometric* dials: they scale with the
   * surface, so a theme multiplies them (`radiusScale` and friends) rather than
   * replacing them. See `LiquiThemeProvider`.
   */
  radius?: number;
  /**
   * The corner's shape. `'squircle'` (the default) is the continuous corner
   * every surface gets: drawn at 1.4× the radius where `corner-shape`
   * renders, so it reads as large as a round one. `'round'` draws a plain
   * circular arc at exactly `radius`, map and lighting included — for the
   * surfaces the system itself draws that way, like the control center's
   * wide slider modules, whose ends are a quarter circle and a short straight
   * run that no squircle fits. A capsule or a disc is round either way.
   */
  corner?: 'squircle' | 'round';
  /** Backdrop blur in px (refraction tier; frost uses 4×). */
  blur?: number;
  /** Strength of the edge refraction in px (feDisplacementMap scale). */
  refraction?: number;
  /** Width in px of the refracting rim at the edge of the surface. */
  bezel?: number;
  /**
   * Chromatic aberration: 0 disables (single displacement pass), >0 splits
   * R/G/B into three displacement passes at ±dispersion relative scale.
   * Costs roughly 3× filter work — keep 0 where perf matters.
   */
  dispersion?: number;
  /**
   * Opacity of the normal-lit specular layer (0 disables). Only rendered in
   * the refraction tier; frost/clear keep the cheap inset-shadow shine.
   */
  specular?: number;
  /**
   * Material density, 0–1, mirroring Apple's Liquid Glass variants:
   * 0 ≈ "clear" (transparent, for media-rich backdrops with their own
   * dimming), 1 ≈ "regular" (adaptive frosted tint that carries legibility).
   * Interpolates tint opacity and adds up to 14px of blur on top of `blur`.
   */
  frost?: number;
  /** Extra saturation pushed through the glass. */
  saturation?: number;
  /** Depth level: raises tint opacity + shadow. */
  elevated?: boolean;
  /**
   * Classes for the content wrapper that sits above every glass layer.
   *
   * Padding, flex layout and typography belong to the *component* built on the
   * glass, not to the glass — but that wrapper is rendered here, so a consumer
   * styling it from outside would need a descendant selector
   * (`[&>.liqui-glass__content]:…`), which utility classes express badly. This
   * prop hands the wrapper over directly so a registry component can stay pure
   * Tailwind.
   */
  contentClassName?: string;
}

/**
 * LiquiGlass — the base surface primitive of the liqui component library.
 * Layers: refracting backdrop → tint → specular rim → content.
 */
export const LiquiGlass = React.forwardRef<HTMLDivElement, LiquiGlassProps>(
  function LiquiGlass(props, forwardedRef) {
    // Theme defaults fill in only where the surface said nothing. A component
    // that hardcodes `frost: 0.6` because its design needs it keeps that value
    // under every theme; the theme owns the dials nobody claimed.
    const theme = useGlassTheme();
    const {
      material = theme.material,
      profile = theme.profile,
      finish = theme.finish,
      lightAngle: ownLightAngle,
      edgeShade: ownEdgeShade,
      hairline: ownHairline,
      brightness: ownBrightness,
      tintFloor: ownTintFloor,
      radius: ownRadius = 16,
      corner = 'squircle',
      blur: ownBlur = 2,
      refraction: ownRefraction = 140,
      bezel: ownBezel = 26,
      dispersion = theme.dispersion,
      specular = theme.specular,
      frost = theme.frost,
      saturation = theme.saturation,
      elevated = false,
      className,
      contentClassName,
      style,
      children,
      ...rest
    } = props;

    // `supportsRefraction` sniffs the UA, so it is false during SSR and true in
    // Chromium — reading it directly at render time would make the server emit
    // the frost tier and the client's first render emit the refract tier, which
    // is a hydration mismatch React explicitly won't patch up. Start every
    // render pass in the tier the server can also produce, then upgrade in a
    // layout effect: that runs after hydration commits but before paint, so
    // there is no visible frost flash. `squircleActive` follows the same
    // pattern: the radius compensation only applies once the client knows
    // corner-shape will actually render, and must not differ from the server
    // markup on the hydration pass.
    const [refractionAllowed, setRefractionAllowed] = React.useState(false);
    const [squircleActive, setSquircleActive] = React.useState(false);
    React.useLayoutEffect(() => {
      if (supportsRefraction) setRefractionAllowed(true);
      if (supportsSquircle) setSquircleActive(true);
    }, []);

    // Geometry is scaled, not replaced — see theme.tsx. Rounding is not
    // cosmetic: radius and bezel key the displacement-map cache and refraction
    // keys the filter registry, so a multiplier dragged through 0.9137× would
    // otherwise mint a fresh canvas render and a fresh <filter> node per frame.
    // Blur only reaches a CSS string, but is rounded for the same reason in
    // reverse — an unrounded one churns the style attribute every frame.
    // Lighting: the surface's own value, else the theme's, else the finish's.
    // The three baked into the specular are rounded — they key the image
    // cache, and a dragged dial would otherwise mint an image set per frame.
    const finishLighting = FINISH_LIGHTING[finish];
    const lightAngle = Math.round(ownLightAngle ?? theme.lightAngle ?? finishLighting.lightAngle);
    const edgeShade =
      Math.round((ownEdgeShade ?? theme.edgeShade ?? finishLighting.edgeShade) * 100) / 100;
    const hairline = Math.round((ownHairline ?? theme.hairline ?? finishLighting.hairline) * 100) / 100;
    const brightness = ownBrightness ?? theme.brightness ?? finishLighting.brightness;
    const tintFloor = ownTintFloor ?? theme.tintFloor ?? finishLighting.tintFloor;

    const baseRadius = Math.round(ownRadius * theme.radiusScale);
    const blur = Math.round(ownBlur * theme.blurScale * 100) / 100;
    const refraction = Math.round(ownRefraction * theme.refractionScale);
    // A zero-width bezel divides through in the map generator (`depth / bezel`),
    // turning the whole surface into NaN displacement — a fully smeared box.
    const bezel = Math.max(1, Math.round(ownBezel * theme.bezelScale));

    const localRef = React.useRef<HTMLDivElement | null>(null);
    const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);

    // Copy refraction, for the browsers that cannot filter the page behind an
    // element: where a `LiquiBackdrop` says what is behind this surface, it
    // refracts a copy of that instead (see backdrop.tsx). Decided in a layout
    // effect like `refractionAllowed`, for the same hydration reason, and only
    // for a surface the box actually contains — a popup portalled out of it
    // is over something else — that is not itself on another surface.
    const backdropHandle = React.useContext(BackdropContext);
    const nested = React.useContext(NestedGlassContext);
    const [copyAllowed, setCopyAllowed] = React.useState(false);
    React.useLayoutEffect(() => {
      const el = localRef.current;
      const box = backdropHandle?.element.current;
      setCopyAllowed(!supportsRefraction && !nested && !!el && !!box && box.contains(el));
    }, [backdropHandle, nested]);

    const tier: 'refract' | 'copy' | 'frost' | 'clear' =
      material === 'clear'
        ? 'clear'
        : material === 'frost'
          ? 'frost'
          : refractionAllowed
            ? 'refract'
            : copyAllowed
              ? 'copy'
              : 'frost';

    // A capsule or a disc — corners reaching half the short side — is drawn
    // with round corners at exactly half that side. A superellipse cannot
    // close into a semicircle: at that radius it draws a bulging rounded
    // rectangle, which on a pill button or a circular control reads as a
    // mistake rather than as a continuous corner.
    //
    // The test is on the radius as it would be *drawn*: compensated where the
    // squircle renders. A 12px corner on a 27px button is a rounded rectangle
    // as written, but 1.4× takes it past half the height, the browser clamps
    // it, and the squircle comes out as exactly that bulge. Past that point
    // the only honest shape is the capsule it was about to become.
    //
    // The radius published as `--lq-radius` is the one drawn, so what is
    // nested inside can be concentric with it. Known once the surface is
    // measured; until then the declared shape stands.
    // Compared before rounding, so the threshold is the one CSS corners use
    // (see `--lq-corner-k` in glass.css) and a solid button and a glass one of
    // the same size land on the same side of it.
    //
    // `corner: 'round'` opts out of the squircle: no compensation, and the
    // map, the lighting and the clip all take circular corners.
    const drawn =
      squircleActive && corner !== 'round' ? baseRadius * SQUIRCLE_RADIUS_SCALE : baseRadius;
    const half = size === null ? Infinity : Math.min(size.w, size.h) / 2;
    const capsule = drawn >= half - 0.5;
    const radius = capsule ? half : Math.round(drawn);
    const roundCorners = capsule || corner === 'round';

    // The empty dependency array is load-bearing. Without it this runs on every
    // render, and each run detaches the previous handle before attaching the
    // new one — which, when the forwarded ref is a *callback* ref, means calling
    // it with `null` and then with the element again, on every render.
    //
    // Base UI hands exactly such a callback ref to any part that belongs to a
    // composite list (a slider thumb, a tab, a menu item), and its cleanup
    // unregisters the item and schedules a state update. Re-render, detach,
    // unregister, re-render: "Maximum update depth exceeded", from a component
    // that is only sitting there. Base UI 1.7 is where the unregister path
    // started scheduling that update, so that is where this surfaced, but the
    // unstable handle was always the defect.
    //
    // The handle is a getter over a ref that outlives every render, so there is
    // nothing for it to depend on.
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement, []);

    React.useLayoutEffect(() => {
      // Measured for the map on the refraction and copy tiers, for the baked
      // rim on frost, and wherever corner-shape renders, for the capsule check
      // above. Only clear glass without a squircle has no use for its size.
      if ((tier === 'clear' && !squircleActive) || !localRef.current) return;
      const el = localRef.current;
      const apply = (w: number, h: number) => {
        if (w > 0 && h > 0) {
          setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
        }
      };
      // Measure synchronously before first paint so the filter is present on
      // the very first frame instead of popping in a few frames later.
      // offsetWidth/contentRect are layout sizes, unaffected by CSS
      // transforms — measuring the bounding rect during the scale(0.85) open
      // animation would bake a permanently undersized map.
      apply(el.offsetWidth, el.offsetHeight);
      const observer = new ResizeObserver((entries) => {
        const rect = entries[0].contentRect;
        apply(Math.round(rect.width), Math.round(rect.height));
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, [tier, squircleActive]);

    // Where the copy sits: the surface's offset in the backdrop's box, and the
    // box's size, so the copy inside is the box's picture shifted to line up.
    // Measured with bounding rects on purpose, against the handbook's advice:
    // the offset *should* include a transform, because a dragged surface is
    // where the drag put it. (The map still takes layout sizes above.) Scroll
    // is listened for in capture, so a scrolling container between the box
    // and the surface counts; a transform fires nothing, which is what
    // `revision` is for.
    const [copyBox, setCopyBox] = React.useState<{
      x: number;
      y: number;
      w: number;
      h: number;
    } | null>(null);
    const revision = backdropHandle?.revision;
    React.useLayoutEffect(() => {
      const el = localRef.current;
      const box = backdropHandle?.element.current;
      if (tier !== 'copy' || !el || !box) return;
      const measure = () => {
        const r = el.getBoundingClientRect();
        const b = box.getBoundingClientRect();
        // Against the box's padding edge, which is where an `inset: 0`
        // backdrop is painted — a bordered box is a border's width off
        // otherwise — and at the padding box's size, for the same reason.
        const next = {
          x: Math.round(r.left - b.left - box.clientLeft),
          y: Math.round(r.top - b.top - box.clientTop),
          w: box.clientWidth,
          h: box.clientHeight,
        };
        setCopyBox((prev) =>
          prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h
            ? prev
            : next,
        );
      };
      measure();
      // Neither observer sees a surface *moved* by a reflow above it — a web
      // font arriving, an image getting its height — while its own size and
      // the box's stay put. The document's height does change then, so the
      // root is watched too, and the two moments that cause most of it are
      // listened for by name.
      const observer = new ResizeObserver(measure);
      observer.observe(box);
      observer.observe(el);
      observer.observe(document.documentElement);
      window.addEventListener('resize', measure);
      window.addEventListener('load', measure);
      window.addEventListener('scroll', measure, true);
      let fonts: Promise<unknown> | undefined;
      if (typeof document.fonts?.ready?.then === 'function') {
        fonts = document.fonts.ready.then(measure);
      }
      return () => {
        void fonts;
        observer.disconnect();
        window.removeEventListener('resize', measure);
        window.removeEventListener('load', measure);
        window.removeEventListener('scroll', measure, true);
      };
    }, [tier, backdropHandle, revision]);

    // frost interpolates toward Apple's "regular" variant: more blur + tint.
    const effectiveBlur = Math.round((blur + frost * 14) * 100) / 100;

    const filtered = tier === 'refract' || tier === 'copy';
    const measured = size !== null && tier !== 'clear';
    // The baked rim is a pair of images, not a filter, so every tier but clear
    // wears it — Safari and Firefox included, where it is the one part of the
    // lighting that survives the loss of backdrop-filter.
    const lit = measured && specular > 0;
    // Tone response of the material: lift the darkest backdrop tones and roll
    // off the brightest, so refracted content sits in a narrower band and the
    // foreground keeps contrast against it. Clear glass (frost 0) needs the
    // full curve — nothing else quiets the backdrop; heavy frost already
    // carries legibility through blur + tint, so the curve relaxes. Rounded to
    // 3 decimals because these key the filter registry (see the geometry
    // rounding note above).
    const toneLift = Math.round(180 * (1 - 0.45 * frost)) / 1000;
    const toneRoll = Math.round(140 * (1 - 0.45 * frost)) / 1000;
    // Filters live in a global, never-unmounted registry so a remounted
    // popup references an already-decoded filter (see filterRegistry.ts).
    // Corners are baked as the browser will clip them: the squircle where it
    // renders, a circle everywhere else.
    const bakeRound = roundCorners || !squircleActive;
    const images = React.useMemo(() => {
      if (!measured || !(lit || filtered)) return null;
      const next = glassImages(
        size!.w,
        size!.h,
        radius,
        bezel,
        profile,
        bakeRound,
        finish,
        { lightAngle, edgeShade, hairline },
        filtered,
      );
      prewarmImage(next.specular);
      prewarmImage(next.specularDark);
      return next;
    }, [
      measured,
      lit,
      filtered,
      size,
      radius,
      bakeRound,
      bezel,
      profile,
      finish,
      lightAngle,
      edgeShade,
      hairline,
    ]);

    const glassRefs = React.useMemo(() => {
      if (!images || !filtered) return null;
      const { id: filterId, cold } = ensureFilter({
        w: size!.w,
        h: size!.h,
        mapHref: images.map,
        refraction,
        dispersion,
        toneLift,
        toneRoll,
      });
      return { filterId, cold };
    }, [images, filtered, size, refraction, dispersion, toneLift, toneRoll]);

    // The masking fade-in is only for a cold filter (feImage still decoding).
    // It must also be REMOVED after it plays: under keepMounted a closed
    // popup is display:none, and re-display restarts any CSS animation still
    // on the element — which would re-fade refraction on every open.
    const [fadeDone, setFadeDone] = React.useState(false);
    const needsFade = (glassRefs?.cold ?? false) && !fadeDone;
    React.useEffect(() => {
      if (!glassRefs?.cold || fadeDone) return;
      const timer = setTimeout(() => setFadeDone(true), 250);
      return () => clearTimeout(timer);
    }, [glassRefs?.cold, fadeDone]);

    // Blur and refraction live on SEPARATE backdrop layers. While feImage
    // decodes its data URL, Chromium treats the whole
    // `url(#f) blur() saturate()` chain as inert — putting them on one layer
    // makes even the base blur pop in late. Layer A (blur+saturate) never
    // changes after first paint; layer B (displacement only) stacks above it,
    // sampling A's output. The map's neutral center makes B a no-op wherever
    // there's no displacement, so B arriving late just fades refraction in
    // over an already-frosted surface.
    // Brightening what the glass shows makes a clear slab read as lit from
    // within rather than tinted (prism's default; classic leaves it at 1).
    // On the copy tier the copy carries blur, saturation and brightness as a
    // CSS filter of its own, so the layer is only there until the copy is —
    // the frame or two before it is measured and its filter is warm.
    const tone = brightness !== 1 ? ` brightness(${brightness})` : '';
    const copyReady = tier === 'copy' && glassRefs !== null && copyBox !== null;
    const backdropFilter =
      tier === 'clear' || copyReady
        ? undefined
        : tier === 'frost' || tier === 'copy'
          ? `blur(${Math.max(effectiveBlur * 2, 10)}px) saturate(${saturation})${tone}`
          : `blur(${effectiveBlur}px) saturate(${saturation})${tone}`;
    // The copy is blurred by a CSS filter on a box a little larger than the
    // surface, so the blur at the surface's edge reads the picture past it
    // rather than fading into nothing; the SVG filter, which the browser
    // runs in software, is left with the displacement alone.
    const copyPad = Math.ceil(effectiveBlur * 3) + 2;
    const refractFilter =
      tier === 'refract' && glassRefs ? `url(#${glassRefs.filterId})` : undefined;
    // frost 0 sits at the floor, frost 1 at full tint. Classic's floor of 0.25
    // reproduces its original `0.25 + 0.75 × frost`; prism's is nearly clear.
    const tintOpacity = tier === 'clear' ? 1 : tintFloor + (1 - tintFloor) * frost;

    return (
      <div
        {...rest}
        ref={localRef}
        className={[
          'liqui-glass',
          `liqui-glass--${tier}`,
          lit ? 'liqui-glass--lit' : '',
          finish === 'prism' ? 'liqui-glass--prism' : '',
          elevated ? 'liqui-glass--elevated' : '',
          className ?? '',
        ]
          .join(' ')
          .trim()}
        style={{
          ...style,
          // Both inherit, so what is painted inside can follow the surface —
          // see "Continuous corners" in glass.css.
          ['--lq-radius' as string]: `${radius}px`,
          ['--lq-corner' as string]: roundCorners ? 'round' : 'squircle',
          // The same shape as a superellipse exponent, for `lq-nest` to
          // compute with; and the nesting a container above set up is not
          // this surface's to inherit.
          ['--lq-corner-n' as string]: roundCorners ? 1 : 2,
          // Toward the light, for the CSS rim the frost and clear tiers draw.
          ['--lq-light-x' as string]: Math.round(Math.sin((lightAngle * Math.PI) / 180) * 100) / 100,
          ['--lq-light-y' as string]: Math.round(-Math.cos((lightAngle * Math.PI) / 180) * 100) / 100,
          ['--lq-item-radius' as string]: 'initial',
          ['--lq-item-corner' as string]: 'initial',
        }}
      >
        {backdropFilter && (
          <span
            className="liqui-glass__backdrop"
            style={{ backdropFilter, WebkitBackdropFilter: backdropFilter }}
          />
        )}
        {refractFilter && (
          <span
            className={
              needsFade
                ? 'liqui-glass__refract liqui-glass__refract--fade'
                : 'liqui-glass__refract'
            }
            style={{ backdropFilter: refractFilter, WebkitBackdropFilter: refractFilter }}
          />
        )}
        {copyReady && backdropHandle && (
          // The backdrop again, shifted so the part under this surface is the
          // part that is actually under it, and refracted as this surface's
          // own content. Nested glass in a backdrop would copy the backdrop
          // into itself without end, so the copy is marked as a surface.
          <span className="liqui-glass__copy" aria-hidden>
            <span
              className={
                needsFade
                  ? 'liqui-glass__copy-lens liqui-glass__refract--fade'
                  : 'liqui-glass__copy-lens'
              }
              style={{ filter: `url(#${glassRefs!.filterId})` }}
            >
              <span
                className="liqui-glass__copy-blur"
                style={{
                  left: -copyPad,
                  top: -copyPad,
                  width: size!.w + 2 * copyPad,
                  height: size!.h + 2 * copyPad,
                  filter: `blur(${effectiveBlur}px) saturate(${saturation})${tone}`,
                }}
              >
                <span
                  className="liqui-glass__copy-inner"
                  style={{
                    left: copyPad - copyBox!.x,
                    top: copyPad - copyBox!.y,
                    width: copyBox!.w,
                    height: copyBox!.h,
                  }}
                >
                  <NestedGlassContext.Provider value={true}>
                    {backdropHandle.backdrop}
                  </NestedGlassContext.Provider>
                </span>
              </span>
            </span>
          </span>
        )}
        <span className="liqui-glass__tint" style={{ opacity: tintOpacity }} />
        {images && lit && (
          <>
            {/* One image per appearance; CSS shows the matching one, so a
                light/dark switch changes the lighting without JS. */}
            <span
              className={[
                'liqui-glass__specular liqui-glass__specular--light',
                needsFade ? 'liqui-glass__specular--fade' : '',
              ]
                .join(' ')
                .trim()}
              style={{
                backgroundImage: `url(${images.specular})`,
                opacity: specular,
              }}
            />
            <span
              className={[
                'liqui-glass__specular liqui-glass__specular--dark',
                needsFade ? 'liqui-glass__specular--fade' : '',
              ]
                .join(' ')
                .trim()}
              style={{
                backgroundImage: `url(${images.specularDark})`,
                opacity: specular,
              }}
            />
          </>
        )}
        <span className="liqui-glass__shine" />
        <NestedGlassContext.Provider value={true}>
          <div className={['liqui-glass__content', contentClassName ?? ''].join(' ').trim()}>
            {children}
          </div>
        </NestedGlassContext.Provider>
      </div>
    );
  },
);
