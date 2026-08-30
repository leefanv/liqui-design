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
 * Rim-light angles: key light toward the top-left corner, dim counter-light
 * toward the bottom-right. Specular intensity falls off with the *positional*
 * azimuth around the shape center (a normal-based falloff would light whole
 * straight edges uniformly — bevel-button, not glass), shaped by a Gaussian
 * band across the bezel. Tuned for the bold arcs of the reference look.
 */
const THETA_KEY = Math.atan2(-0.9, -0.45);
const THETA_COUNTER = Math.atan2(0.9, 0.5);

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
 * surfaces render at half resolution — displacement vectors and the specular
 * glow are smooth fields, so feImage/background stretching is invisible, and
 * generation + PNG decode get ~4× cheaper (less pop-in latency).
 *
 * Bounded LRU: a surface that animates its box (an accordion panel expanding)
 * walks through a distinct size every frame, so an unbounded cache would grow
 * a PNG pair per intermediate height and never release them.
 */
const IMAGE_CACHE_MAX = 48;
const imageCache = new Map<string, { map: string; specular: string }>();

function cacheGet(key: string) {
  const hit = imageCache.get(key);
  if (!hit) return undefined;
  // Re-insert to mark most-recently-used (Map preserves insertion order).
  imageCache.delete(key);
  imageCache.set(key, hit);
  return hit;
}

function cacheSet(key: string, value: { map: string; specular: string }) {
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

  const specCanvas = document.createElement('canvas');
  specCanvas.width = w;
  specCanvas.height = h;
  const specCtx = specCanvas.getContext('2d')!;
  const specImage = specCtx.createImageData(w, h);
  const spec = specImage.data;

  const { mag: lut } = surfaceLUTs(profile);

  const r = Math.min(radius, w / 2, h / 2);
  const bx = w / 2 - r;
  const by = h / 2 - r;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - w / 2;
      const py = y + 0.5 - h / 2;
      const qx = Math.abs(px) - bx;
      const qy = Math.abs(py) - by;

      // Signed distance to the rounded-rect boundary (negative inside).
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const sd = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
      const depth = -sd; // distance from the edge, measured inward

      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0) {
        // Corner region: normal points away from the corner circle center.
        const len = Math.hypot(qx, qy) || 1;
        nx = (Math.sign(px) * qx) / len;
        ny = (Math.sign(py) * qy) / len;
      } else if (qx > qy) {
        nx = Math.sign(px);
      } else {
        ny = Math.sign(py);
      }

      const d = depth / bezel;
      const inRim = d < 1 && d >= 0;
      const idx = inRim ? Math.min(Math.round(d * (LUT_SIZE - 1)), LUT_SIZE - 1) : 0;
      const mag = inRim ? lut[idx] : 0;

      const i = (y * w + x) * 4;
      data[i] = Math.round(128 - nx * mag * 127); // R → x displacement
      data[i + 1] = 128;
      data[i + 2] = Math.round(128 - ny * mag * 127); // B → y displacement
      data[i + 3] = 255;

      // Specular rim light: Gaussian band across the bezel × cosine-power
      // falloff around each light's corner.
      if (inRim) {
        const theta = Math.atan2(py, px);
        const band = Math.exp(-(((d - 0.2) / 0.4) ** 2));
        const c1 = Math.max(Math.cos(theta - THETA_KEY), 0);
        const c2 = Math.max(Math.cos(theta - THETA_COUNTER), 0);
        const intensity = Math.min(band * (1.15 * c1 ** 3 + 0.75 * c2 ** 3.5), 1);
        spec[i] = 255;
        spec[i + 1] = 255;
        spec[i + 2] = 255;
        spec[i + 3] = Math.round(intensity * 255);
      }
    }
  }

  ctx.putImageData(image, 0, 0);
  specCtx.putImageData(specImage, 0, 0);
  const result = { map: canvas.toDataURL(), specular: specCanvas.toDataURL() };
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
    // Filters live in a global, never-unmounted registry so a remounted
    // popup references an already-decoded filter (see filterRegistry.ts).
    const glassRefs = React.useMemo(() => {
      if (!refractionReady) return null;
      const images = glassImages(size!.w, size!.h, radius, bezel, profile);
      prewarmImage(images.specular);
      const { id: filterId, cold } = ensureFilter({
        w: size!.w,
        h: size!.h,
        mapHref: images.map,
        refraction,
        dispersion,
      });
      return { images, filterId, cold };
    }, [refractionReady, size, radius, bezel, profile, refraction, dispersion]);

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
          <span
            className={
              needsFade
                ? 'liqui-glass__specular liqui-glass__specular--fade'
                : 'liqui-glass__specular'
            }
            style={{
              backgroundImage: `url(${glassRefs.images.specular})`,
              opacity: specular,
            }}
          />
        )}
        <span className="liqui-glass__shine" />
        <div className={['liqui-glass__content', contentClassName ?? ''].join(' ').trim()}>
          {children}
        </div>
      </div>
    );
  },
);
