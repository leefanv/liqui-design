'use client';

import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { cn } from '@/lib/utils';

/**
 * liqui ScrollArea — the thumb is the lens, and it is the smallest one here.
 *
 * [Slider](/docs/components/slider) put the glass on the thumb because the
 * thumb is what moves; [Progress](/docs/components/progress) refused to,
 * because its fill *grows* and a surface that changes size asks the map cache
 * for a new entry on every frame. A scrollbar thumb is the slider's case, not
 * the progress bar's: its length is set by the ratio of content to viewport,
 * which does not change while you scroll, so a whole flick reuses one cached
 * map.
 *
 * At twelve px across — a 14px scrollbar with a pixel of padding each side —
 * it is also the narrowest surface in the library, narrower than the checkbox,
 * which CONTRIBUTING nominates as the canary for over-driven optics. Four px of
 * bezel per side leaves four px of flat middle, and `radius` is exactly half the
 * width or the map's corners stop matching the pill it is drawn as. Take either
 * number further and the two walls of the bezel meet and the thumb renders as a
 * smear rather than a lens.
 *
 * There is no track. A groove drawn behind an overlay scrollbar is a second
 * surface for the thumb to refract instead of the page, and the page is the
 * whole point — so the scrollbar is an empty channel that fades in while you
 * are pointing at it or scrolling.
 *
 * A scroll area *inside* a glass panel is the one case this gets wrong on its
 * own: the thumb then bends the panel rather than the page. See the component
 * page — the fix is one prop.
 */

export const ScrollAreaCorner = BaseScrollArea.Corner;

const THUMB_GLASS = {
  radius: 6,
  blur: 1,
  refraction: 16,
  bezel: 4,
} satisfies Partial<LiquiGlassProps>;

export function ScrollArea({ className, ...props }: BaseScrollArea.Root.Props) {
  // `group`, so the viewport's edge fade can be driven by the root's overflow
  // attributes — they are reported here and on the scrollbar, never on the
  // element that actually scrolls.
  return <BaseScrollArea.Root {...props} className={cn('group relative', className)} />;
}

export function ScrollAreaViewport({ className, ...props }: BaseScrollArea.Viewport.Props) {
  return (
    <BaseScrollArea.Viewport
      {...props}
      className={cn(
        'size-full overscroll-contain outline-none',
        'focus-visible:shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--lq-accent)_45%,transparent)]',
        // The content fades out where it runs past the box, rather than being
        // guillotined. Base UI reports each edge separately, so the two ends
        // fade independently: at the top of a list there is nothing above to
        // suggest, and the fade there would be a lie about hidden content.
        '[--lq-fade-start:0px] [--lq-fade-end:0px]',
        'group-data-[overflow-y-start]:[--lq-fade-start:22px]',
        'group-data-[overflow-y-end]:[--lq-fade-end:22px]',
        '[mask-image:linear-gradient(to_bottom,transparent_0,black_var(--lq-fade-start),black_calc(100%-var(--lq-fade-end)),transparent_100%)]',
        className,
      )}
    />
  );
}

export function ScrollAreaContent({ className, ...props }: BaseScrollArea.Content.Props) {
  return <BaseScrollArea.Content {...props} className={cn('min-w-full', className)} />;
}

/**
 * The channel the thumb runs in. Deliberately empty — see the note above.
 *
 * It is inert until you are pointing at the area or scrolling it, which is what
 * `pointer-events-none` and the two `data-` states are doing: an always-on
 * scrollbar over glass reads as a scratch down the side of the surface.
 */
export function ScrollAreaScrollbar({ className, ...props }: BaseScrollArea.Scrollbar.Props) {
  return (
    <BaseScrollArea.Scrollbar
      {...props}
      className={cn(
        'flex touch-none select-none p-px opacity-0 transition-opacity duration-200',
        'pointer-events-none data-[hovering]:pointer-events-auto data-[scrolling]:pointer-events-auto',
        'data-[hovering]:opacity-100 data-[scrolling]:opacity-100 data-[scrolling]:duration-0',
        'data-[orientation=vertical]:w-3.5 data-[orientation=horizontal]:h-3.5',
        className,
      )}
    />
  );
}

export function ScrollAreaThumb({
  glass,
  className,
  ...props
}: BaseScrollArea.Thumb.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseScrollArea.Thumb
      {...props}
      className={cn('size-full', className)}
      render={<LiquiGlass {...THUMB_GLASS} {...glass} contentClassName="size-full" />}
    />
  );
}
