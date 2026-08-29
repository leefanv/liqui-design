'use client';

import * as React from 'react';
import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui Avatar — a lens with a picture set into it.
 *
 * A photo that covers the whole disc turns the surface off. Not figuratively:
 * `LiquiGlass` renders content above every glass layer, so a full-bleed image
 * hides the tint, the specular arc and the entire bezel, and what is left is a
 * round `<img>` with a shadow. Every other component in the library has content
 * that leaves the rim visible — a menu item does not reach the edge, a track is
 * mostly empty — and an avatar is the one place where the content is the whole
 * box by default.
 *
 * So the picture is inset by the width of the bezel. The glass keeps a ring of
 * itself all the way round, the ring is the part that refracts the page, and
 * the avatar reads as a porthole: a lens with something behind it, which is
 * what the material is for. With no picture the whole disc is glass and the
 * initials float on it.
 *
 * Because the ring *is* the bezel, size cannot be a class here — see the
 * `size` prop.
 */

export interface AvatarProps extends BaseAvatar.Root.Props {
  /**
   * Diameter in px. This is a prop rather than a `size-*` class because three
   * numbers are derived from it: the radius must be exactly half the box or the
   * displacement map's corners stop matching the circle it is drawn as, and the
   * bezel — which is also the visible ring — has to shrink with the disc or a
   * 24px avatar is nothing but rim. Checkbox pins its optics because it is one
   * fixed size; an avatar is not, so the numbers scale instead.
   */
  size?: number;
  /** Overrides for the underlying glass disc (refraction, frost, specular…). */
  glass?: Partial<LiquiGlassProps>;
  /**
   * Narrowed from Base UI's `style | (state) => style`, because `size` is
   * merged into it below and a function has nothing to merge into.
   */
  style?: React.CSSProperties;
}

export function Avatar({ size = 40, glass, className, children, style, ...props }: AvatarProps) {
  // 0.17 of the diameter, which is the checkbox's ratio (6px of bezel on a 20px
  // box) carried up: below about a fifth the rim stops reading as thickness,
  // above it the two walls of the bezel meet in the middle and smear.
  const ring = Math.max(3, Math.round(size * 0.17));

  return (
    <BaseAvatar.Root
      {...props}
      // Font size travels with the disc so the fallback's initials do too:
      // they are sized in `em` below, which is the only way one class works
      // at every diameter the `size` prop allows.
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36), ...style }}
      className={cn('inline-flex flex-none select-none align-middle', className)}
      render={
        <LiquiGlass
          radius={size / 2}
          blur={1}
          // Refraction is a displacement in px, so it scales with the box the
          // same way the bezel does; these are the checkbox's numbers at 20px
          // read as ratios (1× the diameter) rather than absolutes.
          refraction={Math.round(size)}
          bezel={ring}
          {...glass}
          contentClassName="size-full rounded-full"
        />
      }
    >
      <span className="block size-full" style={{ padding: ring }}>
        {children}
      </span>
    </BaseAvatar.Root>
  );
}

/**
 * `m-0!` is not decoration, and the `!` is not laziness. This file ships into
 * someone else's project, and a typography plugin — Tailwind's own `prose`, or
 * the docs styles on the page you are reading — gives every `<img>` a vertical
 * margin measured in `em`. Inside a 40px disc that is enough to push the picture
 * clean out of the porthole. Those rules are written at the same specificity as
 * a utility class and loaded after it, so a plain `m-0` loses; the picture is
 * not prose and has to say so.
 */
export function AvatarImage({ className, ...props }: BaseAvatar.Image.Props) {
  return (
    <BaseAvatar.Image
      {...props}
      className={cn('m-0! size-full rounded-full object-cover', className)}
    />
  );
}

/**
 * Initials, or whatever stands in for the picture. Sits inside the same inset
 * as the image so the two do not jump when one replaces the other, which is
 * visible on a slow connection: `delay` holds this back until the image has had
 * its chance, and a fallback that landed at a different size would flash.
 */
export function AvatarFallback({ className, ...props }: BaseAvatar.Fallback.Props) {
  return (
    <BaseAvatar.Fallback
      {...props}
      className={cn(
        'flex size-full items-center justify-center rounded-full text-[1em] leading-none font-semibold tracking-[0.02em] text-[var(--lq-text)] uppercase',
        className,
      )}
    />
  );
}
