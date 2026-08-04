/**
 * Global registry of refraction filters.
 *
 * `backdrop-filter: url(#id)` resolves by id across the document, so filter
 * defs don't have to live inside the surface that uses them. Keeping every
 * filter (and its decoded feImage displacement map) in one persistent hidden
 * <svg> means popups can unmount freely: the next surface with the same
 * parameters references an already-decoded filter and refracts on its first
 * frame — the same "pay once at page load" economics as a permanently
 * mounted element, without keeping anything mounted.
 *
 * Only the very first surface ever rendered at a given (size, shape, optics)
 * pays the one-off feImage decode, which the refract layer's fade-in masks.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

interface FilterParams {
  w: number;
  h: number;
  mapHref: string;
  refraction: number;
  dispersion: number;
}

const ISOLATE = {
  R: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  G: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  B: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
};

let host: SVGSVGElement | null = null;
const filterIds = new Map<string, string>();
let nextId = 0;

/**
 * Cap mirrors the image cache's LRU: a surface animating its box requests a
 * filter per intermediate size. Eviction removes the oldest filter node; a
 * mid-animation element referencing it re-requests on its next frame anyway.
 */
const FILTER_CACHE_MAX = 128;

function ensureHost(): SVGSVGElement {
  if (host && host.isConnected) return host;
  host = document.createElementNS(SVG_NS, 'svg');
  host.setAttribute('width', '0');
  host.setAttribute('height', '0');
  host.setAttribute('aria-hidden', 'true');
  host.style.position = 'absolute';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);
  return host;
}

function el(
  name: string,
  attrs: Record<string, string | number>,
): SVGElement {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function displacement(scale: number, result?: string): SVGElement {
  const node = el('feDisplacementMap', {
    in: 'SourceGraphic',
    in2: 'map',
    scale,
    xChannelSelector: 'R',
    yChannelSelector: 'B',
  });
  if (result) node.setAttribute('result', result);
  return node;
}

/**
 * Returns the id of a filter implementing the given optics, creating it in
 * the persistent host on first request. Filters are never removed — they are
 * tiny, and keeping them is exactly what makes remounts free.
 */
export function ensureFilter(params: FilterParams): string {
  const { w, h, mapHref, refraction, dispersion } = params;
  // The map href fully encodes size/radius/bezel/profile (it's cached by
  // those in glassImages), so id dedup can key on it plus the optics.
  const key = `${w}x${h}|r${refraction}|d${dispersion}|${mapHref.length}:${mapHref.slice(-24)}`;
  const existing = filterIds.get(key);
  if (existing) return existing;

  const id = `lq-refract-${nextId++}`;
  const filter = el('filter', {
    id,
    x: 0,
    y: 0,
    width: w,
    height: h,
    filterUnits: 'userSpaceOnUse',
    'color-interpolation-filters': 'sRGB',
  });

  const image = el('feImage', { x: 0, y: 0, width: w, height: h, result: 'map' });
  image.setAttribute('href', mapHref);
  filter.appendChild(image);

  if (dispersion > 0) {
    filter.appendChild(displacement(refraction * (1 - dispersion), 'dispR'));
    filter.appendChild(el('feColorMatrix', { in: 'dispR', values: ISOLATE.R, result: 'chR' }));
    filter.appendChild(displacement(refraction, 'dispG'));
    filter.appendChild(el('feColorMatrix', { in: 'dispG', values: ISOLATE.G, result: 'chG' }));
    filter.appendChild(displacement(refraction * (1 + dispersion), 'dispB'));
    filter.appendChild(el('feColorMatrix', { in: 'dispB', values: ISOLATE.B, result: 'chB' }));
    filter.appendChild(
      el('feComposite', { in: 'chR', in2: 'chG', operator: 'arithmetic', k2: 1, k3: 1, result: 'chRG' }),
    );
    filter.appendChild(
      el('feComposite', { in: 'chRG', in2: 'chB', operator: 'arithmetic', k2: 1, k3: 1 }),
    );
  } else {
    filter.appendChild(displacement(refraction));
  }

  ensureHost().appendChild(filter);
  filterIds.set(key, id);
  if (filterIds.size > FILTER_CACHE_MAX) {
    const [oldestKey, oldestId] = filterIds.entries().next().value!;
    filterIds.delete(oldestKey);
    host?.querySelector(`#${oldestId}`)?.remove();
  }
  return id;
}

/** Warm the browser image cache for a data URL (e.g. the specular PNG). */
export function prewarmImage(href: string) {
  const img = new Image();
  img.src = href;
}
