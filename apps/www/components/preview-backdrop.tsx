import * as React from 'react';

import { cn } from '@/lib/utils';
import { Wallpaper } from '@/components/wallpaper';

/**
 * Glass has nothing to show on a flat fill — the lens refracts whatever is
 * behind it, so a preview on the page background reads as a slightly grey box
 * and makes the library look broken. Every preview therefore sits on a backdrop
 * with real structure: by default a wallpaper whose ridge line bends visibly
 * through the bezel, which is also the setting the material is designed for.
 *
 * `gradient` is the generated alternative, kept for pages that want colour
 * under the glass rather than a photograph. `flat` exists so the docs can
 * demonstrate the failure mode deliberately.
 */
export function PreviewBackdrop({
  variant = 'wallpaper',
  className,
  children,
}: {
  variant?: 'wallpaper' | 'gradient' | 'flat';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      // Stable hook for the visual regression suite. Selecting these by class
      // would break on any restyle, which is exactly when the screenshots need
      // to still be pointing at the right element.
      data-preview={variant}
      // The gradient backdrop is dark regardless of the page theme, so the
      // glass tokens inside it have to be the dark set — otherwise a reader on
      // the light docs theme gets near-black body text sitting on a near-black
      // backdrop. `wallpaper` and `flat` follow the page instead: the wallpaper
      // ships as a matched day/night pair and swaps with the theme, so pinning
      // it would put dark glass on bright sand half the time, and `flat`'s whole
      // job is to look like the surrounding surface.
      data-theme={variant === 'gradient' ? 'dark' : undefined}
      className={cn(
        // `not-prose`, because what is inside is a component and not an article.
        // The docs theme styles `p`, `img` and friends at a specificity that
        // beats a utility class, so without this an avatar's picture is pushed
        // out of its own disc by a 28px `img` margin and every demo's paragraphs
        // are spaced for prose. A preview has to render the way the component
        // renders in an app that has never heard of this stylesheet.
        'not-prose relative isolate overflow-hidden rounded-xl border border-fd-border',
        variant === 'flat' && 'bg-fd-muted',
        className,
      )}
    >
      {variant === 'wallpaper' && <Wallpaper />}
      {variant === 'gradient' && <GradientField />}
      {children}
    </div>
  );
}

function GradientField() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 bg-[#0b1020]">
      <div className="absolute -top-[30%] -left-[10%] size-[70%] rounded-full bg-[#ff5f6d] opacity-70 blur-3xl" />
      <div className="absolute top-[10%] left-[35%] size-[60%] rounded-full bg-[#2f6bff] opacity-70 blur-3xl" />
      <div className="absolute -right-[5%] -bottom-[25%] size-[65%] rounded-full bg-[#00d2a8] opacity-60 blur-3xl" />
      <div className="absolute right-[20%] bottom-[10%] size-[35%] rounded-full bg-[#ffc94d] opacity-60 blur-3xl" />
      {/* Hard edges the displacement map can actually bend — pure blurs alone
          make refraction nearly invisible. */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/60" />
      <div className="absolute inset-y-0 left-[28%] w-px bg-white/40" />
      <div className="absolute inset-y-0 left-[72%] w-px bg-white/30" />
    </div>
  );
}
