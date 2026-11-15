'use client';

import * as React from 'react';
import {
  defaultGlassTheme,
  LiquiGlass,
  LiquiThemeProvider,
  type LiquiGlassTheme,
} from '@liqui-design/glass';

import { Backdrop, BACKDROPS, type BackdropId } from '@/components/home/backdrops';
import { CONTROL_CENTER_WIDTH, ControlCenter } from '@/components/home/control-center';
import {
  ControlGroup,
  GlassControls,
  opticsFromTheme,
  opticsToTheme,
  PanelActions,
  Segmented,
  sameOptics,
  shuffleOptics,
  withoutThemeScales,
  type GlassOptics,
} from '@/components/glass-controls';
import { useSiteTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/registry/liqui/ui/scroll-area';
import { Separator } from '@/registry/liqui/ui/separator';

/**
 * The home page's argument, made by letting you move the glass rather than by
 * describing it. A still image cannot show refraction — the effect only reads
 * when an edge passes under the bezel — so the control center is draggable and
 * the optics are live.
 *
 * The components inside are the same files `shadcn add` installs, imported from
 * the registry. If this looks right, what you install looks right — which is
 * why the controls are built out of them too, down to the scrollbar on the
 * optics panel.
 */

/**
 * The optics panel's own surface: its geometry, and nothing else. The panel
 * stands under the optics it is setting (see the provider around it below),
 * so finish, lighting, frost, dispersion and the multipliers all reach it and
 * every control on it — move a dial and the instrument changes with the
 * modules. Only the shape is the panel's own, scaled like any component's.
 */
const PANEL_GLASS = {
  elevated: true,
  radius: 18,
  blur: 1,
  refraction: 110,
  bezel: 22,
} as const;

/**
 * The panel reads as an instrument window: a title bar with the three lights,
 * a hairline under it, the dials below. The lights are decoration and say so —
 * `aria-hidden`, no hover, nothing to click — because a close button that does
 * not close is worse than none.
 */
function TitleBar({ title }: { title: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-[7px] px-3.5 py-2.5">
        <span aria-hidden className="size-[11px] rounded-full bg-[#ff5f57]" />
        <span aria-hidden className="size-[11px] rounded-full bg-[#febc2e]" />
        <span aria-hidden className="size-[11px] rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[12.5px] font-semibold text-[var(--lq-text-dim)]">{title}</span>
      </div>
      <Separator />
    </div>
  );
}

/**
 * Where the stage starts, and where Reset takes it back to: whatever the site
 * theme is wearing, read into the panel's units. A theme made on /theme lands
 * here too — a prism theme opens the stage on prism, its own frost and bend.
 *
 * Except where the theme leaves a dial on the shipped value. There the stage
 * keeps its own: the system's control center blurs what is behind its modules
 * heavily — the white type on them depends on it — and a panel that opened on
 * clearer glass than the thing it imitates would be starting from the wrong
 * picture. A theme that does set one of these has said what it wants, and
 * gets it.
 */
function stageOptics(theme: LiquiGlassTheme): GlassOptics {
  const optics = opticsFromTheme(theme);
  if (theme.frost === defaultGlassTheme.frost) optics.frost = 0.5;
  if (theme.specular === defaultGlassTheme.specular) optics.specular = 0.85;
  if (theme.blurScale === defaultGlassTheme.blurScale) optics.blur = 2;
  return optics;
}

export function GlassStage() {
  const { theme } = useSiteTheme();
  const base = React.useMemo(() => stageOptics(theme.glass), [theme.glass]);
  const [backdrop, setBackdrop] = React.useState<BackdropId>('wallpaper');
  const [optics, setOptics] = React.useState<GlassOptics>(base);
  // The stored theme is read after hydration, and the site theme can change
  // under the stage; either way the panel follows it. Dials moved here are a
  // look at the stage, not an edit to the theme, so they give way.
  React.useEffect(() => {
    setOptics((current) => (sameOptics(current, base) ? current : base));
  }, [base]);
  // The panel reads what renders, theme multipliers included; the surfaces
  // are under that same theme and multiply again, so they get it divided out.
  const own = React.useMemo(() => withoutThemeScales(optics, theme.glass), [optics, theme.glass]);
  // The panel wears what it is setting. The readings are absolute — site
  // multipliers already in them — so this replaces the site's glass theme
  // under the panel rather than stacking on it; only the corner multiplier,
  // which the panel has no dial for, is carried over.
  const panelTheme = React.useMemo(
    () => ({ glass: { ...opticsToTheme(optics), radiusScale: theme.glass.radiusScale } }),
    [optics, theme.glass.radiusScale],
  );
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);

  const stageRef = React.useRef<HTMLDivElement>(null);
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const origin = React.useRef({ px: 0, py: 0, x: 0, y: 0 });

  // Pointer capture rather than window listeners: the drag keeps following the
  // pointer even when it leaves the handle, and releases cleanly if the browser
  // cancels the gesture.
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    origin.current = { px: event.clientX, py: event.clientY, x: pos.x, y: pos.y };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const stage = stageRef.current;
    const next = {
      x: origin.current.x + (event.clientX - origin.current.px),
      y: origin.current.y + (event.clientY - origin.current.py),
    };
    const surface = surfaceRef.current;
    if (stage && surface) {
      // Keep the surface inside the stage; dragging it off screen would just
      // look broken. Measured from where layout actually put it rather than
      // assumed to start at the centre — beside the panel it does not — and
      // with offset*, which ignore the translate being applied here.
      const inset = 8;
      const minX = inset - surface.offsetLeft;
      const maxX = stage.clientWidth - surface.offsetLeft - surface.offsetWidth - inset;
      const minY = inset - surface.offsetTop;
      const maxY = stage.clientHeight - surface.offsetTop - surface.offsetHeight - inset;
      next.x = Math.min(Math.max(next.x, minX), Math.max(maxX, minX));
      next.y = Math.min(Math.max(next.y, minY), Math.max(maxY, minY));
    }
    setPos(next);
  };

  const endDrag = () => setDragging(false);

  return (
    <div
      ref={stageRef}
      data-glass-stage={backdrop}
      // On a phone the panel spans the bottom of the stage, so the surface
      // moves to the top and the stage grows to hold both — centred, the
      // panel covered the very surface it was tuning. Wider, the panel docks
      // right and the surface centres in what is left beside it.
      className="relative isolate flex min-h-[57rem] w-full items-start justify-center overflow-hidden rounded-3xl border border-fd-border pt-8 sm:min-h-[38rem] sm:items-center sm:pt-0 sm:pr-[18rem]"
      // Every generated backdrop is dark whatever the page is wearing, so the
      // glass on top of them has to be the dark token set. The wallpaper is the
      // exception: it ships as a day/night pair and follows the page, so the
      // stage lets the theme through and the surface is lit to match the
      // photograph behind it.
      data-theme={backdrop === 'wallpaper' ? undefined : 'dark'}
    >
      <Backdrop id={backdrop} />

      {/* The surfaces under test: a control center, dragged as one group by
          the pill above it. Only the pill starts a drag — the modules are
          buttons and sliders, and a drag that began on one would fight it. */}
      <div
        ref={surfaceRef}
        className="flex flex-col items-center gap-2.5"
        style={{ width: CONTROL_CENTER_WIDTH, transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        <LiquiGlass
          {...own}
          radius={14}
          refraction={own.refraction * 0.2}
          bezel={Math.max(4, own.bezel * 0.25)}
          className="select-none"
          contentClassName="rounded-[inherit]"
        >
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={cn(
              'flex touch-none items-center gap-2 px-3.5 py-1.5 text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[var(--lq-text-dim)]',
              dragging ? 'cursor-grabbing' : 'cursor-grab',
            )}
          >
            <svg width="14" height="8" viewBox="0 0 14 8" fill="currentColor" aria-hidden>
              <circle cx="2" cy="2" r="1" />
              <circle cx="7" cy="2" r="1" />
              <circle cx="12" cy="2" r="1" />
              <circle cx="2" cy="6" r="1" />
              <circle cx="7" cy="6" r="1" />
              <circle cx="12" cy="6" r="1" />
            </svg>
            drag me over an edge
          </div>
        </LiquiGlass>
        <ControlCenter optics={own} />
      </div>

      {/* Controls */}
      <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-4 sm:w-[17rem]">
        {/* The panel is a liqui surface and scrolls with liqui's own scroll
            area. A native `overflow-y-auto` here put a square-cornered
            scrollbar through the rounded corner of a glass panel, on the front
            page of a glass library.

            A definite height rather than a max: Base UI's viewport is the
            element that scrolls and sizes itself to its content, so a
            `max-height` on the root clamps the panel and lets the content
            overflow it instead of scrolling. Beside the surface the panel
            runs the full height of the stage, inset as far from the bottom
            as from the top and the side, and the scroll area takes whatever
            the title bar leaves — the stage's own height is the definite one.
            On a phone, where the panel spans the full width under the
            surface, it keeps a fixed height instead. */}
        <LiquiThemeProvider theme={panelTheme} injectTokens={false}>
        <LiquiGlass
          {...PANEL_GLASS}
          className="sm:h-full"
          contentClassName="flex flex-col rounded-[inherit] sm:h-full"
        >
          <TitleBar title="Optics" />
          <ScrollArea className="h-60 sm:h-auto sm:min-h-0 sm:flex-1">
            {/* No edge fade: a mask makes the viewport a backdrop root, and
                every lens in it — slider thumbs, toggle strips — would sample
                the transparent scroll content instead of the panel and the
                page, and draw dark. */}
            <ScrollAreaViewport className="[mask-image:none]">
              <ScrollAreaContent className="flex flex-col gap-5 px-4 pt-3.5 pb-4">
                {/* Which picture is behind the glass. Not an optic, so it is
                    the stage's group rather than the shared panel's — the
                    playground has a desktop there instead. */}
                <ControlGroup title="Backdrop">
                  <Segmented
                    label="Backdrop"
                    items={BACKDROPS.slice(0, 3).map((b) => ({ ...b, value: b.id }))}
                    value={backdrop}
                    onValueChange={setBackdrop}
                  />
                  <Segmented
                    label="More backdrops"
                    items={BACKDROPS.slice(3).map((b) => ({ ...b, value: b.id }))}
                    value={backdrop}
                    onValueChange={setBackdrop}
                  />
                </ControlGroup>
                <GlassControls value={optics} onChange={setOptics} />
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar>
              <ScrollAreaThumb />
            </ScrollAreaScrollbar>
          </ScrollArea>
          <PanelActions
            onShuffle={() => setOptics(shuffleOptics(optics))}
            dirty={!sameOptics(optics, base) || pos.x !== 0 || pos.y !== 0}
            onReset={() => {
              setOptics(base);
              setPos({ x: 0, y: 0 });
            }}
          />
        </LiquiGlass>
        </LiquiThemeProvider>
      </div>
    </div>
  );
}

