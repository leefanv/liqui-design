import type { Palette } from '@/registry/liqui/lib/media-player-data';

/**
 * What the glass is looking at.
 *
 * Everything on this page is a lens, and a lens over a flat fill is a grey box.
 * So the page gets a real subject: four colour fields from the current track's
 * palette, and — the part that actually matters — a set of hard edges laid over
 * them. Displacement moves pixels sideways. Move a pixel of an even gradient
 * and it lands on a neighbour that looks the same, which is why an all-blur
 * backdrop refracts invisibly. Move a pixel of a 1px rule and the rule visibly
 * bends. The blurs supply the colour; the rules supply the evidence.
 *
 * The palette comes in as a prop rather than being read from a context, so the
 * whole backdrop is a pure function of the current track. Changing track
 * changes every surface's refraction at once, and that transition is the
 * template's one real argument for the material.
 */
export function PlayerBackdrop({ palette }: { palette: Palette }) {
  const [a, b, c, d] = palette.stops;

  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden" style={{ background: d }}>
      {/* Colour. Sized in vmax so the composition holds its proportions from a
          phone to an ultrawide instead of the blobs sliding off one edge. */}
      <div
        className="absolute -top-[20%] -left-[10%] size-[70vmax] rounded-full opacity-80 blur-[90px] transition-colors duration-700"
        style={{ background: a }}
      />
      <div
        className="absolute top-[25%] left-[30%] size-[65vmax] rounded-full opacity-75 blur-[100px] transition-colors duration-700"
        style={{ background: b }}
      />
      <div
        className="absolute -right-[15%] -bottom-[25%] size-[75vmax] rounded-full opacity-70 blur-[110px] transition-colors duration-700"
        style={{ background: c }}
      />

      {/* Evidence. Thin enough to read as texture at rest, and the first thing
          you notice moving when a surface passes over them. */}
      <div className="absolute inset-x-0 top-[38%] h-px bg-white/50" />
      <div className="absolute inset-x-0 top-[62%] h-px bg-white/30" />
      <div className="absolute inset-y-0 left-[22%] w-px bg-white/40" />
      <div className="absolute inset-y-0 left-[64%] w-px bg-white/25" />

      {/* A diagonal band, so the edges are not all axis-aligned — refraction
          along a slanted boundary is easier to see than along a level one. */}
      <div
        className="absolute -inset-x-[20%] top-[8%] h-24 origin-left -rotate-6 opacity-30 transition-colors duration-700"
        style={{ background: `linear-gradient(90deg, transparent, ${a}, transparent)` }}
      />

      {/* Darkens the lower half so body text over the backdrop keeps contrast
          no matter which palette is current. Sits above the fields, below the
          content — glass surfaces refract this too, which is fine: it is a
          gradient with no edges of its own and adds nothing to bend. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />
    </div>
  );
}
