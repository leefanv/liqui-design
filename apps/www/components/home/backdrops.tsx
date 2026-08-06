import * as React from 'react';

/**
 * Backdrops for the home stage.
 *
 * All generated in CSS rather than shipped as images — partly for weight, but
 * mostly because refraction needs *hard edges* to be visible and a photograph
 * mostly gives you soft ones. The hairlines and grids below are there to be
 * bent; without something crossing the bezel, a lens looks like a tint.
 *
 * `flat` is deliberately unimpressive. It is the one that teaches what the
 * material actually needs.
 */

export type BackdropId = 'aurora' | 'grid' | 'spectrum' | 'flat';

export const BACKDROPS: { id: BackdropId; label: string; hint: string }[] = [
  { id: 'aurora', label: 'Aurora', hint: 'Soft colour with a few hard lines to bend' },
  { id: 'grid', label: 'Grid', hint: 'Nothing but edges — refraction at its most obvious' },
  { id: 'spectrum', label: 'Spectrum', hint: 'High chroma, where dispersion shows' },
  { id: 'flat', label: 'Flat', hint: 'A lens over a solid colour shows you the solid colour' },
];

export function Backdrop({ id }: { id: BackdropId }) {
  if (id === 'flat') {
    return <div aria-hidden className="absolute inset-0 -z-10 bg-[#3b3f52]" />;
  }

  if (id === 'grid') {
    return (
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#0a0d18]">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 44px), repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 44px)',
          }}
        />
        <div className="absolute -top-[20%] left-[10%] size-[60%] rounded-full bg-[#2f6bff] opacity-50 blur-3xl" />
        <div className="absolute -right-[10%] bottom-[-20%] size-[55%] rounded-full bg-[#00d2a8] opacity-40 blur-3xl" />
      </div>
    );
  }

  if (id === 'spectrum') {
    return (
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'conic-gradient(from 210deg at 45% 40%, #ff5f6d, #ffc94d, #00d2a8, #2f6bff, #a855f7, #ff5f6d)',
        }}
      >
        <div className="absolute inset-x-0 top-[38%] h-px bg-white/80" />
        <div className="absolute inset-y-0 left-[62%] w-px bg-black/40" />
      </div>
    );
  }

  return (
    <div aria-hidden className="absolute inset-0 -z-10 bg-[#080b16]">
      <div className="absolute -top-[25%] -left-[5%] size-[65%] rounded-full bg-[#ff5f6d] opacity-70 blur-3xl" />
      <div className="absolute top-[5%] left-[30%] size-[60%] rounded-full bg-[#2f6bff] opacity-70 blur-3xl" />
      <div className="absolute right-[-8%] bottom-[-25%] size-[60%] rounded-full bg-[#00d2a8] opacity-60 blur-3xl" />
      <div className="absolute right-[18%] bottom-[8%] size-[32%] rounded-full bg-[#ffc94d] opacity-55 blur-3xl" />
      {/* The part that actually demonstrates the lens. */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/70" />
      <div className="absolute inset-y-0 left-[26%] w-px bg-white/45" />
      <div className="absolute inset-y-0 left-[70%] w-px bg-white/35" />
    </div>
  );
}
