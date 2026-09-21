'use client';

import * as React from 'react';
import { LiquiGlass } from '@liqui-design/glass';

import { Backdrop, BACKDROPS, type BackdropId } from '@/components/home/backdrops';
import { DEFAULT_OPTICS, GlassControls, type GlassOptics } from '@/components/glass-controls';
import { cn } from '@/lib/utils';
import { Button } from '@/registry/liqui/ui/button';
import { Checkbox, CheckboxLabel } from '@/registry/liqui/ui/checkbox';
import { Field, FieldControl, FieldLabel } from '@/registry/liqui/ui/field';
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/registry/liqui/ui/scroll-area';
import { Toggle } from '@/registry/liqui/ui/toggle';

/**
 * The home page's argument, made by letting you move the glass rather than by
 * describing it. A still image cannot show refraction — the effect only reads
 * when an edge passes under the bezel — so the surface is draggable and the
 * optics are live.
 *
 * The components inside are the same files `shadcn add` installs, imported from
 * the registry. If this looks right, what you install looks right — which is
 * why the controls are built out of them too, down to the scrollbar on the
 * optics panel.
 */

/**
 * The optics panel's own surface, and deliberately *not* the dials the panel is
 * setting. The playground lets its panel wear the live optics, because there
 * the whole page is the demo; here there is one surface under test and the
 * panel is the instrument reading it. A panel that went `material: 'clear'`
 * along with the card would be a control you had just made harder to see.
 *
 * `frost: 0.6` is Tooltip's argument: this is small text with no container of
 * its own, standing on a photograph, and legibility cannot be left to whatever
 * the wallpaper happens to be doing behind it.
 */
const PANEL_GLASS = {
  elevated: true,
  radius: 20,
  blur: 1,
  refraction: 110,
  bezel: 22,
  frost: 0.6,
} as const;

export function GlassStage() {
  const [backdrop, setBackdrop] = React.useState<BackdropId>('wallpaper');
  const [optics, setOptics] = React.useState<GlassOptics>(DEFAULT_OPTICS);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [checked, setChecked] = React.useState(true);

  const stageRef = React.useRef<HTMLDivElement>(null);
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
    if (stage) {
      // Keep the surface inside the stage; dragging it off screen would just
      // look broken.
      const limitX = Math.max(0, stage.clientWidth / 2 - 190);
      const limitY = Math.max(0, stage.clientHeight / 2 - 150);
      next.x = Math.min(limitX, Math.max(-limitX, next.x));
      next.y = Math.min(limitY, Math.max(-limitY, next.y));
    }
    setPos(next);
  };

  const endDrag = () => setDragging(false);

  return (
    <div
      ref={stageRef}
      data-glass-stage={backdrop}
      className="relative isolate flex min-h-[34rem] w-full items-center justify-center overflow-hidden rounded-3xl border border-fd-border sm:min-h-[38rem]"
      // Every generated backdrop is dark whatever the page is wearing, so the
      // glass on top of them has to be the dark token set. The wallpaper is the
      // exception: it ships as a day/night pair and follows the page, so the
      // stage lets the theme through and the surface is lit to match the
      // photograph behind it.
      data-theme={backdrop === 'wallpaper' ? undefined : 'dark'}
    >
      <Backdrop id={backdrop} />

      {/* The surface under test */}
      <LiquiGlass
        elevated
        radius={24}
        {...optics}
        className={cn('w-[21rem] max-w-[calc(100%-2rem)] select-none', dragging && 'cursor-grabbing')}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        contentClassName="rounded-[inherit] overflow-hidden"
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            'flex items-center justify-center gap-2 py-2 text-[11px] tracking-[0.14em] uppercase text-[var(--lq-text-dim)]',
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

        <div className="flex flex-col gap-4 px-5 pt-1 pb-5">
          <Field>
            <FieldLabel>Workspace</FieldLabel>
            <FieldControl placeholder="acme-design" />
          </Field>
          <CheckboxLabel>
            <Checkbox checked={checked} onCheckedChange={setChecked} />
            Refract the backdrop
          </CheckboxLabel>
          <div className="flex gap-2">
            <Button>Cancel</Button>
            <Button variant="accent">Continue</Button>
          </div>
        </div>
      </LiquiGlass>

      {/* Controls */}
      <div className="absolute inset-x-3 bottom-3 flex flex-col gap-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-60">
        {/* A picker, in pill form: exactly one backdrop is on, so each chip is
            a latching control and gets Toggle's treatment — flat at rest, a
            solid accent fill while it is the one selected. It used to hardcode
            white-on-black alphas, which assumed the backdrop was always dark
            and went muddy the day the day-lit wallpaper became the default.
            The tokens follow the stage's own theme instead.

            `onPressedChange` only ever turns one *on*: pressing the active chip
            would otherwise leave the stage with no backdrop at all. */}
        <div className="flex flex-wrap gap-1.5">
          {BACKDROPS.map((b) => (
            <Toggle
              key={b.id}
              pressed={backdrop === b.id}
              onPressedChange={(pressed) => pressed && setBackdrop(b.id)}
              title={b.hint}
              className="rounded-full px-2.5 py-1 text-[11.5px]"
            >
              {b.label}
            </Toggle>
          ))}
        </div>

        {/* The panel is a liqui surface and scrolls with liqui's own scroll
            area. A native `overflow-y-auto` here put a square-cornered
            scrollbar through the rounded corner of a glass panel, on the front
            page of a glass library.

            A definite height rather than a max: Base UI's viewport is the
            element that scrolls and sizes itself to its content, so a
            `max-height` on the root clamps the panel and lets the content
            overflow it instead of scrolling. Eight dials are taller than this
            at every breakpoint, so there is no dead space to trade for it.

            Shorter on a phone, where the panel spans the full width and the
            surface it is tuning is directly behind it rather than beside it. */}
        <LiquiGlass {...PANEL_GLASS} contentClassName="rounded-[inherit]">
          <ScrollArea className="h-64 sm:h-[23rem]">
            <ScrollAreaViewport>
              <ScrollAreaContent className="px-3.5 py-3">
                <GlassControls
                  value={optics}
                  onChange={setOptics}
                  onReset={() => {
                    setOptics(DEFAULT_OPTICS);
                    setPos({ x: 0, y: 0 });
                  }}
                />
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar>
              {/* On a panel, so the thumb has the panel's tint behind it rather
                  than the page — see the Scroll Area page. */}
              <ScrollAreaThumb glass={{ material: 'clear' }} />
            </ScrollAreaScrollbar>
          </ScrollArea>
        </LiquiGlass>
      </div>
    </div>
  );
}

