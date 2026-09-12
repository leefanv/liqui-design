import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The photographic backdrop shared by the home stage and every docs preview.
 *
 * A dune under a mountain ridge, shot twice — day and night — from the same
 * position. That matters more than it sounds: the two files are
 * interchangeable at any crop, so switching the page theme swaps the light for
 * the dark without the composition moving underneath the glass.
 *
 * It earns its place over the generated backdrops on one point. Refraction is
 * only visible where an edge passes under the bezel, and the ridge line is a
 * genuine one — high-frequency, irregular, running the full width of the frame
 * at roughly the height a surface sits. The generated backdrops have to draw
 * hairlines to get the same thing; here it is in the photograph, which is also
 * what the material is actually for.
 *
 * Nothing is layered on top to make the glass easier to read. A veil here would
 * buy legibility by throwing away the thing the wallpaper is for, and it would
 * hide the real defect: where text on this photograph fails, it is the surface
 * under it that is too thin, and that is a property of the material.
 *
 * Both images are declared, but only the one for the current theme is
 * displayed, and a background on a `display: none` element is never fetched —
 * so a reader downloads one wallpaper, not two.
 *
 * `mode` pins the picture instead of letting the page's theme pick it. The
 * theme editor needs that: it renders the token set you are *editing*, which is
 * not necessarily the one the docs around it are wearing, and following the
 * page there would put dark glass on the day photograph — measurably the worst
 * combination the material has.
 */
export function Wallpaper({
  mode,
  className,
}: {
  mode?: 'light' | 'dark';
  className?: string;
}) {
  const light = 'url(/backdrops/light.jpg)';
  const dark = 'url(/backdrops/dark.jpg)';

  if (mode) {
    return (
      <div
        aria-hidden
        className={cn('absolute inset-0 -z-10 bg-cover bg-center', className)}
        style={{ backgroundImage: mode === 'dark' ? dark : light }}
      />
    );
  }

  return (
    <div aria-hidden className={cn('absolute inset-0 -z-10', className)}>
      <div
        className="absolute inset-0 bg-cover bg-center dark:hidden"
        style={{ backgroundImage: light }}
      />
      <div
        className="absolute inset-0 hidden bg-cover bg-center dark:block"
        style={{ backgroundImage: dark }}
      />
    </div>
  );
}
