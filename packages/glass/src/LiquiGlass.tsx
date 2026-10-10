import * as React from 'react';
import { ensureFilter, prewarmImage } from './filterRegistry';
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
 * flanks fall into a thin shade. What keeps this from reading as a bevelled
 * button is the shaping: the highlight lives in a ~1px stroke hugging the
 * boundary plus a few px of diffuse glow, not a wide band across the bezel.
 * (The earlier positional-azimuth model lit straight edges unevenly, which is
 * the single most visible tell against real glass.)
 */
const LIGHT_SPREAD = 1.08; // radians off vertical the top/bottom highlight reaches
const DIFFUSE_SPREAD = LIGHT_SPREAD * 0.65;
const SIDE_SPREAD = 0.98; // radians off horizontal the side shade reaches

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
 */
function surfaceField(
  px: number,
  py: number,
  bx: number,
  by: number,
  r: number,
  out: SurfaceField,
) {
  const qx = Math.abs(px) - bx;
  const qy = Math.abs(py) - by;
  if (qx > 0 && qy > 0) {
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
) {
  const key = `${fullW}x${fullH}r${fullRadius}b${fullBezel}${profile}`;
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

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - w / 2;
      const py = y + 0.5 - h / 2;
      surfaceField(px, py, bx, by, r, field);
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
   * Specular overlay, one image per appearance. Unpremultiplied compose of
   * two features, both driven by the outline normal and distance:
   *
   * - highlight — a crisp stroke hugging the boundary where the normal faces
   *   up or down (times a soft compression so it never clips), plus a wider
   *   diffuse glow fading over a few px into the surface;
   * - shade — a hairline just inside the left/right flanks, the dark
   *   contact edge that makes the bright arcs read as a lit rim rather than
   *   a painted-on white line.
   *
   * Dark appearance dims the highlight and deepens the shade; the two PNGs
   * are swapped by CSS (see glass.css) so the appearance change needs no JS.
   */
  const specW = fullW;
  const specH = fullH;
  const specR = Math.min(fullRadius, specW / 2, specH / 2);
  const specBx = specW / 2 - specR;
  const specBy = specH / 2 - specR;

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
  const cosSide = Math.cos(SIDE_SPREAD);
  // The diffuse glow reaches a few px into the surface, growing gently with
  // the bezel so wide rims keep a visible inner falloff.
  const reach = 4.5 + fullBezel * 0.15;

  const compose = (
    out: Uint8ClampedArray,
    i: number,
    specAmount: number,
    diffuse: number,
    shadeBase: number,
    specScale: number,
    diffuseScale: number,
    shadeStrength: number,
  ) => {
    const highlight = sat(specAmount * specScale + diffuse * diffuseScale);
    const shade = shadeBase * shadeStrength;
    const alpha = highlight + shade * (1 - highlight);
    if (alpha <= 0) return;
    // Light over a dark rim, unpremultiplied for the PNG encoder.
    const value = Math.min((specScale * highlight) / alpha, 1);
    const v = Math.round(value * 255);
    out[i] = v;
    out[i + 1] = v;
    out[i + 2] = v;
    out[i + 3] = Math.round(Math.min(alpha, 1) * 255);
  };

  for (let y = 0; y < specH; y++) {
    for (let x = 0; x < specW; x++) {
      const px = x + 0.5 - specW / 2;
      const py = y + 0.5 - specH / 2;
      surfaceField(px, py, specBx, specBy, specR, field);
      const sd = field.sd;
      // Everything lives within a hair of the boundary; skip the bulk early.
      if (sd > 1 || sd < -(reach + 1)) continue;

      const coverage = sat(0.5 - sd);
      const vertical = Math.abs(field.ny);
      const directional = Math.pow(sat((vertical - cosLight) / (1 - cosLight)), 1.25);
      const diffuseDir = Math.pow(sat((vertical - cosDiffuse) / (1 - cosDiffuse)), 1.25);
      const stroke = sat(sd + 1.4) * sat(0.5 - sd);
      let specAmount = directional * stroke;
      specAmount = specAmount / (1 + 0.5 * (1 - specAmount));
      const glow = 1 - sat(-sd / reach);
      const diffuse = diffuseDir * 0.18 * glow * glow * coverage;

      // Side shade: same hairline band, weighted toward horizontal normals.
      const wL = sat((field.nx - cosSide) / (1 - cosSide)) * stroke;
      const wR = sat((-field.nx - cosSide) / (1 - cosSide)) * stroke;
      const shadeBase = wL / (1 + 0.4 * (1 - wL)) + wR / (1 + 0.4 * (1 - wR));

      const i = (y * specW + x) * 4;
      compose(lightImage.data, i, specAmount, diffuse, shadeBase, 1, 1, 0.48);
      compose(darkImage.data, i, specAmount, diffuse, shadeBase, 0.82, 0.4, 0.6);
    }
  }
  lightCtx.putImageData(lightImage, 0, 0);
  darkCtx.putImageData(darkImage, 0, 0);

  const result = {
    map: canvas.toDataURL(),
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
  /**
   * Corner radius of the glass surface in px.
   *
   * This and the three below are the *geometric* dials: they scale with the
   * surface, so a theme multiplies them (`radiusScale` and friends) rather than
   * replacing them. See `LiquiThemeProvider`.
   */
  radius?: number;
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
      radius: ownRadius = 16,
      blur: ownBlur = 1,
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

    // Geometry is scaled, not replaced — see theme.tsx. Rounding is not
    // cosmetic: radius and bezel key the displacement-map cache and refraction
    // keys the filter registry, so a multiplier dragged through 0.9137× would
    // otherwise mint a fresh canvas render and a fresh <filter> node per frame.
    // Blur only reaches a CSS string, but is rounded for the same reason in
    // reverse — an unrounded one churns the style attribute every frame.
    const radius = Math.round(ownRadius * theme.radiusScale);
    const blur = Math.round(ownBlur * theme.blurScale * 100) / 100;
    const refraction = Math.round(ownRefraction * theme.refractionScale);
    // A zero-width bezel divides through in the map generator (`depth / bezel`),
    // turning the whole surface into NaN displacement — a fully smeared box.
    const bezel = Math.max(1, Math.round(ownBezel * theme.bezelScale));

    // `supportsRefraction` sniffs the UA, so it is false during SSR and true in
    // Chromium — reading it directly at render time would make the server emit
    // the frost tier and the client's first render emit the refract tier, which
    // is a hydration mismatch React explicitly won't patch up. Start every
    // render pass in the tier the server can also produce, then upgrade in a
    // layout effect: that runs after hydration commits but before paint, so
    // there is no visible frost flash.
    const [refractionAllowed, setRefractionAllowed] = React.useState(false);
    React.useLayoutEffect(() => {
      if (supportsRefraction) setRefractionAllowed(true);
    }, []);

    const tier: 'refract' | 'frost' | 'clear' =
      material === 'clear'
        ? 'clear'
        : material === 'frost'
          ? 'frost'
          : refractionAllowed
            ? 'refract'
            : 'frost';

    const localRef = React.useRef<HTMLDivElement | null>(null);
    const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);

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
      if (tier !== 'refract' || !localRef.current) return;
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
    }, [tier]);

    const refractionReady = tier === 'refract' && size !== null;
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
    const glassRefs = React.useMemo(() => {
      if (!refractionReady) return null;
      const images = glassImages(size!.w, size!.h, radius, bezel, profile);
      prewarmImage(images.specular);
      prewarmImage(images.specularDark);
      const { id: filterId, cold } = ensureFilter({
        w: size!.w,
        h: size!.h,
        mapHref: images.map,
        refraction,
        dispersion,
        toneLift,
        toneRoll,
      });
      return { images, filterId, cold };
    }, [refractionReady, size, radius, bezel, profile, refraction, dispersion, toneLift, toneRoll]);

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

    // frost interpolates toward Apple's "regular" variant: more blur + tint.
    const effectiveBlur = blur + frost * 14;
    // Blur and refraction live on SEPARATE backdrop layers. While feImage
    // decodes its data URL, Chromium treats the whole
    // `url(#f) blur() saturate()` chain as inert — putting them on one layer
    // makes even the base blur pop in late. Layer A (blur+saturate) never
    // changes after first paint; layer B (displacement only) stacks above it,
    // sampling A's output. The map's neutral center makes B a no-op wherever
    // there's no displacement, so B arriving late just fades refraction in
    // over an already-frosted surface.
    const backdropFilter =
      tier === 'clear'
        ? undefined
        : tier === 'frost'
          ? `blur(${Math.max(effectiveBlur * 2, 10)}px) saturate(${saturation})`
          : `blur(${effectiveBlur}px) saturate(${saturation})`;
    const refractFilter = glassRefs ? `url(#${glassRefs.filterId})` : undefined;
    const tintOpacity = tier === 'clear' ? 1 : 0.25 + 0.75 * frost;

    return (
      <div
        {...rest}
        ref={localRef}
        className={[
          'liqui-glass',
          `liqui-glass--${tier}`,
          elevated ? 'liqui-glass--elevated' : '',
          className ?? '',
        ]
          .join(' ')
          .trim()}
        style={{ ...style, ['--lq-radius' as string]: `${radius}px` }}
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
        <span className="liqui-glass__tint" style={{ opacity: tintOpacity }} />
        {glassRefs && specular > 0 && (
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
                backgroundImage: `url(${glassRefs.images.specular})`,
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
                backgroundImage: `url(${glassRefs.images.specularDark})`,
                opacity: specular,
              }}
            />
          </>
        )}
        <span className="liqui-glass__shine" />
        <div className={['liqui-glass__content', contentClassName ?? ''].join(' ').trim()}>
          {children}
        </div>
      </div>
    );
  },
);
