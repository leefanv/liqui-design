import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Glass has nothing to show on a flat fill — the lens refracts whatever is
 * behind it, so a preview on the page background reads as a slightly grey box
 * and makes the library look broken. Every preview therefore sits on a backdrop
 * with real structure: overlapping colour blobs whose edges bend visibly
 * through the bezel.
 *
 * `flat` exists so the docs can demonstrate that failure mode deliberately.
 */
export function PreviewBackdrop({
  variant = 'gradient',
  className,
  children,
}: {
  variant?: 'gradient' | 'photo' | 'flat';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      // Stable hook for the visual regression suite. Selecting these by class
      // would break on any restyle, which is exactly when the screenshots need
      // to still be pointing at the right element.
      data-preview={variant}
      // The gradient and photo backdrops are dark regardless of the page theme,
      // so the glass tokens inside them have to be the dark set — otherwise a
      // reader on the light docs theme gets near-black body text sitting on a
      // near-black backdrop. `flat` follows the page instead, because its whole
      // job is to look like the surrounding surface.
      data-theme={variant === 'flat' ? undefined : 'dark'}
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
      {variant === 'gradient' && <GradientField />}
      {variant === 'photo' && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: 'url(/backdrops/desk.jpg)' }}
        />
      )}
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
