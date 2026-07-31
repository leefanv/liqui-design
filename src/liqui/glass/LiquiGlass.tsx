import * as React from 'react';
import './glass.css';

/**
 * Refraction (backdrop-filter: url(#svg-filter)) currently only renders in
 * Chromium. Safari/Firefox silently drop the whole backdrop-filter value when
 * an SVG reference is present, so we feature-gate and fall back to frosted
 * glass (blur + saturate) there.
 */
const supportsRefraction = (() => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isFirefox = /firefox/i.test(ua);
  const isSafari = /^((?!chrome|chromium|edg|android).)*safari/i.test(ua);
  return !isFirefox && !isSafari && CSS.supports('backdrop-filter', 'blur(1px)');
})();

/**
 * Displacement map for the lens effect, generated per-pixel on a canvas.
 * The R channel encodes horizontal displacement, the B channel vertical;
 * 128 is neutral. Using a rounded-rect signed distance field, the center of
 * the surface stays flat while a `bezel`-wide rim at the edge refracts
 * outward with an eased falloff, like the rim of real glass.
 *
 * (Canvas instead of an SVG data-URI: feImage rasterizes SVG images with
 * CSS features like mix-blend-mode disabled, which silently corrupts
 * gradient-composited maps.)
 */
function displacementMap(w: number, h: number, radius: number, bezel: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(w, h);
  const data = image.data;

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

      // Eased rim profile: 0 in the flat center, 1 at the very edge.
      const t = Math.min(Math.max(1 - depth / bezel, 0), 1);
      const mag = t * t;

      // Sample toward the center (negative along the outward normal): the rim
      // magnifies the backdrop like a convex lens edge. Sampling outward would
      // hit Chromium's edge-clamp (the backdrop outside the element is not
      // available to the filter) and smear instead of refract.
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

export interface LiquiGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Corner radius of the glass surface in px. */
  radius?: number;
  /** Backdrop blur in px. */
  blur?: number;
  /** Strength of the edge refraction (feDisplacementMap scale). */
  refraction?: number;
  /** Width in px of the refracting rim at the edge of the surface. */
  bezel?: number;
  /** Extra saturation pushed through the glass. */
  saturation?: number;
  /** Depth level: raises tint opacity + shadow. 1 = floating popup, 0 = inline chrome. */
  elevated?: boolean;
}

/**
 * LiquiGlass — the base surface primitive of the liqui component library.
 * Layers: refracting backdrop → tint → specular rim → content.
 */
export const LiquiGlass = React.forwardRef<HTMLDivElement, LiquiGlassProps>(
  function LiquiGlass(props, forwardedRef) {
    const {
      radius = 16,
      blur = 3,
      refraction = 60,
      bezel = 14,
      saturation = 1.6,
      elevated = false,
      className,
      style,
      children,
      ...rest
    } = props;

    const filterId = React.useId().replace(/:/g, '');
    const localRef = React.useRef<HTMLDivElement | null>(null);
    const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);

    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);

    React.useLayoutEffect(() => {
      if (!supportsRefraction || !localRef.current) return;
      const el = localRef.current;
      const observer = new ResizeObserver((entries) => {
        const rect = entries[0].target.getBoundingClientRect();
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (w > 0 && h > 0) {
          setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    const refractionReady = supportsRefraction && size !== null;
    const mapHref = React.useMemo(
      () => (refractionReady ? displacementMap(size!.w, size!.h, radius, bezel) : null),
      [refractionReady, size, radius, bezel],
    );
    const backdropFilter = refractionReady
      ? `url(#${filterId}) blur(${blur}px) saturate(${saturation})`
      : `blur(${blur * 4}px) saturate(${saturation})`;

    return (
      <div
        {...rest}
        ref={localRef}
        className={['liqui-glass', elevated ? 'liqui-glass--elevated' : '', className ?? '']
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
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={refraction}
                xChannelSelector="R"
                yChannelSelector="B"
              />
            </filter>
          </svg>
        )}
        <span
          className="liqui-glass__backdrop"
          style={{ backdropFilter, WebkitBackdropFilter: backdropFilter }}
        />
        <span className="liqui-glass__tint" />
        <span className="liqui-glass__shine" />
        <div className="liqui-glass__content">{children}</div>
      </div>
    );
  },
);
