import * as React from 'react';

/**
 * Refraction where `backdrop-filter` cannot carry it.
 *
 * A surface refracts by filtering what is painted behind it — `backdrop-filter:
 * url(#svg)`, which Safari and Firefox do not draw today. What both do draw is
 * the same SVG filter on an element's *own* content. So where a surface can be
 * told what is behind it, it renders a copy of that inside itself, lined up
 * with the original, and refracts the copy. The surface then looks the same in
 * every browser; only Chromium gets there by reading the real backdrop.
 *
 * `LiquiBackdrop` is how a surface is told. It is a positioned box that paints
 * `backdrop` behind its children, and any `LiquiGlass` inside it — in the DOM,
 * not only in the tree — copies that `backdrop` when it cannot refract the
 * page. The copy is offset by the surface's own position in the box, so the
 * picture under the glass is the one that is actually there.
 *
 * Two surfaces are left on frost, since what is behind them is not the
 * backdrop alone: one nested inside another (what is behind a button on a
 * panel is the panel), and one portalled out of the box (a popup over a
 * dialog). Both still get the baked rim; the copy is the only part they skip.
 *
 * `revision` is for a backdrop whose surfaces *move* without resizing — a
 * dragged group, a transform. Each surface re-measures its offset on resize
 * and on scroll, but a transform is invisible to both; change `revision` when
 * one is applied and every surface in the box lines up again.
 */
export interface LiquiBackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What the box paints behind its children — an image, a gradient, a scene. */
  backdrop: React.ReactNode;
  /** Change it when something inside moves by a transform. */
  revision?: number | string;
}

export interface BackdropHandle {
  element: React.RefObject<HTMLDivElement | null>;
  backdrop: React.ReactNode;
  revision: number | string | undefined;
}

export const BackdropContext = React.createContext<BackdropHandle | null>(null);

/**
 * True inside a `LiquiGlass`, so a surface knows what is behind it is another
 * surface rather than the backdrop. Provided by LiquiGlass itself.
 */
export const NestedGlassContext = React.createContext(false);

export const LiquiBackdrop = React.forwardRef<HTMLDivElement, LiquiBackdropProps>(
  function LiquiBackdrop({ backdrop, revision, style, children, ...rest }, forwardedRef) {
    const element = React.useRef<HTMLDivElement | null>(null);
    React.useImperativeHandle(forwardedRef, () => element.current as HTMLDivElement, []);
    const handle = React.useMemo<BackdropHandle>(
      () => ({ element, backdrop, revision }),
      [backdrop, revision],
    );
    return (
      <div
        {...rest}
        ref={element}
        // The surfaces measure their offset from this box, so it has to be
        // the containing block the backdrop is painted in.
        style={{ position: 'relative', ...style }}
      >
        {backdrop}
        <BackdropContext.Provider value={handle}>{children}</BackdropContext.Provider>
      </div>
    );
  },
);
