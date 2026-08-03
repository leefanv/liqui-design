import * as React from 'react';
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
const lutCache = new Map<GlassProfile, Float32Array>();

function refractionLUT(profile: GlassProfile): Float32Array {
  const cached = lutCache.get(profile);
  if (cached) return cached;

  const lut = new Float32Array(LUT_SIZE);
  if (profile === 'rim') {
    for (let i = 0; i < LUT_SIZE; i++) {
      const d = i / (LUT_SIZE - 1);
      lut[i] = (1 - d) * (1 - d);
    }
  } else {
    const n = 1.5; // refractive index of glass
    const T = 0.6; // slab thickness relative to bezel width
    const h =
      profile === 'squircle'
        ? (t: number) => Math.pow(1 - Math.pow(1 - t, 4), 0.25)
        : (t: number) => Math.sqrt(1 - (1 - t) * (1 - t));
    const eps = 1 / 1024;
    let max = 0;
    for (let i = 0; i < LUT_SIZE; i++) {
      const t = Math.max(i / (LUT_SIZE - 1), eps);
      const hi = Math.min(t + eps, 1);
      const lo = Math.max(t - eps, 0);
      const slope = ((h(hi) - h(lo)) / (hi - lo)) * T;
      const thetaI = Math.atan(Math.abs(slope));
      const delta = thetaI - Math.asin(Math.sin(thetaI) / n);
      lut[i] = h(t) * T * Math.tan(delta);
      max = Math.max(max, lut[i]);
    }
    if (max > 0) for (let i = 0; i < LUT_SIZE; i++) lut[i] /= max;
  }
  lutCache.set(profile, lut);
  return lut;
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
function displacementMap(
  w: number,
  h: number,
  radius: number,
  bezel: number,
  profile: GlassProfile,
) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(w, h);
  const data = image.data;
  const lut = refractionLUT(profile);

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
      const mag =
        d >= 1 || d < 0
          ? 0
          : lut[Math.min(Math.round(d * (LUT_SIZE - 1)), LUT_SIZE - 1)];

      const i = (y * w + x) * 4;
      data[i] = Math.round(128 - nx * mag * 127); // R → x displacement
      data[i + 1] = 128;
      data[i + 2] = Math.round(128 - ny * mag * 127); // B → y displacement
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

const ISOLATE_R = '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0';
const ISOLATE_G = '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0';
const ISOLATE_B = '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0';

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
  /** Corner radius of the glass surface in px. */
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
  /** Extra saturation pushed through the glass. */
  saturation?: number;
  /** Depth level: raises tint opacity + shadow. */
  elevated?: boolean;
}

/**
 * LiquiGlass — the base surface primitive of the liqui component library.
 * Layers: refracting backdrop → tint → specular rim → content.
 */
export const LiquiGlass = React.forwardRef<HTMLDivElement, LiquiGlassProps>(
  function LiquiGlass(props, forwardedRef) {
    const {
      material = 'auto',
      profile = 'squircle',
      radius = 16,
      blur = 3,
      refraction = 100,
      bezel = 18,
      dispersion = 0,
      saturation = 1.6,
      elevated = false,
      className,
      style,
      children,
      ...rest
    } = props;

    const tier: 'refract' | 'frost' | 'clear' =
      material === 'clear'
        ? 'clear'
        : material === 'frost'
          ? 'frost'
          : supportsRefraction
            ? 'refract'
            : 'frost';

    const filterId = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const localRef = React.useRef<HTMLDivElement | null>(null);
    const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);

    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);

    React.useLayoutEffect(() => {
      if (tier !== 'refract' || !localRef.current) return;
      const observer = new ResizeObserver((entries) => {
        const rect = entries[0].target.getBoundingClientRect();
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (w > 0 && h > 0) {
          setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
        }
      });
      observer.observe(localRef.current);
      return () => observer.disconnect();
    }, [tier]);

    const refractionReady = tier === 'refract' && size !== null;
    const mapHref = React.useMemo(
      () =>
        refractionReady
          ? displacementMap(size!.w, size!.h, radius, bezel, profile)
          : null,
      [refractionReady, size, radius, bezel, profile],
    );

    const backdropFilter =
      tier === 'clear'
        ? undefined
        : refractionReady
          ? `url(#${filterId}) blur(${blur}px) saturate(${saturation})`
          : `blur(${blur * 4}px) saturate(${saturation})`;

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
        {refractionReady && (
          <svg className="liqui-glass__defs" aria-hidden width="0" height="0">
            <filter
              id={filterId}
              x="0"
              y="0"
              width={size.w}
              height={size.h}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={mapHref!}
                x="0"
                y="0"
                width={size.w}
                height={size.h}
                result="map"
              />
              {dispersion > 0 ? (
                <>
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="map"
                    scale={refraction * (1 - dispersion)}
                    xChannelSelector="R"
                    yChannelSelector="B"
                    result="dispR"
                  />
                  <feColorMatrix in="dispR" values={ISOLATE_R} result="chR" />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="map"
                    scale={refraction}
                    xChannelSelector="R"
                    yChannelSelector="B"
                    result="dispG"
                  />
                  <feColorMatrix in="dispG" values={ISOLATE_G} result="chG" />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="map"
                    scale={refraction * (1 + dispersion)}
                    xChannelSelector="R"
                    yChannelSelector="B"
                    result="dispB"
                  />
                  <feColorMatrix in="dispB" values={ISOLATE_B} result="chB" />
                  <feComposite in="chR" in2="chG" operator="arithmetic" k2="1" k3="1" result="chRG" />
                  <feComposite in="chRG" in2="chB" operator="arithmetic" k2="1" k3="1" />
                </>
              ) : (
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="map"
                  scale={refraction}
                  xChannelSelector="R"
                  yChannelSelector="B"
                />
              )}
            </filter>
          </svg>
        )}
        {backdropFilter && (
          <span
            className="liqui-glass__backdrop"
            style={{ backdropFilter, WebkitBackdropFilter: backdropFilter }}
          />
        )}
        <span className="liqui-glass__tint" />
        <span className="liqui-glass__shine" />
        <div className="liqui-glass__content">{children}</div>
      </div>
    );
  },
);
