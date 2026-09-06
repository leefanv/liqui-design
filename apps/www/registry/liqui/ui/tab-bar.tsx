'use client';

import * as React from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import {
  buildLensMaps,
  createSpringLoop,
  LensFilter,
  LIP,
  lerp,
  spring,
  supportsRefraction,
  type LensMaps,
} from '@/lib/lens';
import { cn } from '@/lib/utils';

/**
 * liqui TabBar — the iOS floating tab bar.
 *
 * Apple's guidance is literal about the material: a tab bar *floats above
 * content at the bottom of the screen*, and its items *rest on a Liquid Glass
 * background that allows content beneath to peek through*. So the bar is glass
 * and it refracts the page scrolling underneath it.
 *
 * The selection pill inside it is glass too, and that is the part worth
 * explaining, because the library's other nested surfaces say you cannot do
 * that. A lens inside a lens samples its parent's output rather than the page,
 * and a *frosted* parent leaves it nothing but a wash to bend — which is why
 * Switch on a popover ships with `lens={false}`.
 *
 * The escape is that frost is a dial, not a property of glass. This bar runs at
 * `frost: 0` with barely any blur: a clear pane with its refraction at the rim,
 * which is what iOS's own tab bar looks like. The page arrives behind the pill
 * with its edges intact, and the pill can be a real lens over it.
 *
 * Which makes the press the same move Switch makes. At rest the pill is a soft
 * highlight and its lens is nearly closed. Press, and it swells past the item,
 * its fill thins, and the refraction opens up — so the page bends through the
 * tab under your finger. Nothing about that is a blur.
 *
 * The search button is not one of the tabs. Apple calls this the *button
 * appearance* of a search tab, against the *standard tab* style that navigates
 * to a search landing page: it "displays the search tab as a separate button
 * and allows people to start searching immediately", and it "brings people
 * directly back to their previous tab after they exit search". So it is a
 * trigger, not a destination — there is no state for it to be *in*, which is
 * why it is a `<button>` outside the tablist rather than a `Tabs.Tab`.
 * `role="tab"` promises a selected state, and a control that never has one
 * should not claim it.
 *
 * Tapping it expands the field leftward out of the button and focuses it. The
 * expansion is a `clip-path`, not a width, and that is not a stylistic choice:
 * the kernel keys a displacement map on size, so animating the width of a glass
 * surface asks for a new map on every frame and walks the cache clean on the
 * way past. There are three fixed sizes here — the bar, the button, and a field
 * as wide as both — and the transition only ever reveals one of them.
 */

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

const BAR_PAD = 6;
const ITEM_H = 46;
const BAR_H = ITEM_H + BAR_PAD * 2;

/**
 * A nearly clear pane, and the number that matters is `frost`.
 *
 * It is the one dial that decides whether the pill below can be a lens at all.
 * `frost` buys tint *and* blur together — 14px of it at full — and blur is what
 * destroys a nested lens: it takes the edges out of the backdrop before the
 * pill ever gets to bend them. Tint costs nothing, because a uniform darkening
 * leaves every edge exactly where it was.
 *
 * So this sits at the bottom of the range rather than at zero. Zero reads as no
 * bar at all: the page runs straight through it and the labels have to compete
 * with whatever is scrolling behind them. 0.16 is 2px of blur — enough to seat
 * the labels, not enough to close the pill.
 */
const BAR_GLASS = {
  radius: BAR_H / 2,
  blur: 0.2,
  frost: 0.16,
  refraction: 64,
  bezel: 17,
} satisfies Partial<LiquiGlassProps>;

/**
 * The expanded field is the same capsule at a different frost, and it can be:
 * nothing is nested inside it. The bar is held at 0.16 by the pill it has to
 * keep alive; the field has no pill, so it is free to be a proper frosted
 * surface — which it needs to be, because it holds text you have to read
 * against whatever is scrolling behind it.
 */
const FIELD_GLASS = {
  ...BAR_GLASS,
  blur: 1,
  frost: 0.42,
} satisfies Partial<LiquiGlassProps>;

/* -------------------------------------------------------------------------- */
/* Pill optics                                                                 */
/* -------------------------------------------------------------------------- */

/** Band width and edge displacement, as fractions of the pill's own box. */
const PILL_BEZEL = 0.413;
const PILL_PEAK = 0.3196;
/** Fraction of the peak the lens runs at, released and held. */
const REST_RATIO = 0.14;
const PRESS_RATIO = 1;
/**
 * The highlight over the lens: a selected tab at rest, a window under a press.
 *
 * Full strength at rest, and it has to be. `--lq-highlight` is 0.5 white on a
 * light theme and 0.18 on a dark one, which is exactly the relationship the
 * platform uses — a white pill on a grey bar, a lighter grey pill on a dark
 * one. Taking a fraction of that, as this did, left 0.13 white on dark: a
 * selected tab you had to go looking for.
 */
const REST_FILL = 1;
const PRESS_FILL = 0.08;

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;
/**
 * Swell under a finger. Capped by the bar rather than by taste: at 1.16 a 46px
 * pill reaches 53px inside a 58px bar, so it grows visibly and still never
 * breaks the capsule it lives in.
 */
const PRESS_SCALE = 1.16;
/** How far a pressed item's contents sink. */
const PRESS_SINK = 0.1;

/**
 * How far the pill stretches at speed, and the speed that gets it there.
 *
 * Tied to the spring's own velocity rather than to a keyframe, so a hop between
 * neighbours barely deforms and a jump across the bar deforms a lot — which is
 * what the eye expects of something with mass.
 */
const STRETCH_MAX = 0.2;
const STRETCH_SPEED = 2600;

/* -------------------------------------------------------------------------- */
/* The pill                                                                    */
/* -------------------------------------------------------------------------- */

interface PillHandle {
  /** Move the pill's box. `jump` places it without travelling. */
  place(x: number, w: number, jump?: boolean): void;
  press(on: boolean): void;
  show(on: boolean): void;
}

/**
 * A lens that can be moved, pressed and hidden.
 *
 * It owns its own maps, filter and springs because both places that use one —
 * the bar and the detached search button — want exactly the same press, and the
 * only difference between them is that the search pill never travels.
 */
const Pill = React.forwardRef<PillHandle, { height: number; lens?: boolean }>(function Pill(
  { height, lens = true },
  forwarded,
) {
  const filterId = `lq-tabpill-${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const elementRef = React.useRef<HTMLSpanElement | null>(null);
  const scaleRef = React.useRef<SVGFEDisplacementMapElement | null>(null);
  const hasLens = React.useRef(false);
  const [maps, setMaps] = React.useState<LensMaps | null>(null);
  /** The width the maps were built for; the pill only ever resizes on layout. */
  const [width, setWidth] = React.useState(0);

  const engine = React.useRef({
    x: spring(520, 40),
    w: spring(520, 40),
    /**
     * Softer than it wants to be, on purpose. A stiffer press spring covers a
     * quarter of its travel in the first frame, and a quarter of a 16% swell is
     * a scale jumping 4% between two frames with nothing in between — which
     * does not read as fast, it reads as a flash.
     */
    press: spring(900, 46),
    visible: spring(900, 46),
    /**
     * The deformation follows the travel rather than being computed from it.
     *
     * Reading the stretch straight off the position spring's velocity was the
     * flicker: a spring released against a 200px target is already doing
     * 1700px/s one frame later, which saturates the mapping immediately, so the
     * pill snapped from round to fully stretched between two frames. Running it
     * through a spring of its own gives the deformation the ramp the motion
     * itself has.
     */
    stretch: spring(520, 44),
    placed: false,
  }).current;

  const paint = React.useCallback(() => {
    const { x, w, press, visible, stretch } = engine;
    const el = elementRef.current;
    // Aimed here and integrated by the loop, so it can only ever ease toward
    // the speed the pill is actually doing.
    stretch.target = Math.min(Math.abs(x.velocity) / STRETCH_SPEED, STRETCH_MAX);
    if (el) {
      const s = stretch.value;
      const swell = lerp(1, PRESS_SCALE, press.value);
      el.style.translate = `${x.value}px 0`;
      el.style.width = `${w.value}px`;
      el.style.scale = `${(1 + s) * swell} ${(1 - s * 0.45) * swell}`;
      el.style.opacity = `${visible.value}`;
      // Clamped, and it has to be.
      //
      // `press` is underdamped on purpose — the overshoot is what makes the
      // release feel sprung — so on the way back it goes a little past zero and
      // this lerp comes out just above `REST_FILL`. Every other consumer of an
      // overshooting spring absorbs that quietly: `scale` and the displacement
      // `scale` take any number, and CSS clamps `opacity` itself.
      // `color-mix()` is the one that does not. A percentage outside 0–100% is
      // not clamped, it is *invalid*, and an invalid value drops the whole
      // declaration — so the pill's fill vanished entirely for the ~165ms the
      // spring spent above 100%, then snapped back on the frame it crossed
      // under. That was the flicker, and it read as the dark half of the pill
      // blinking because losing the fill is what uncovers the bar behind it.
      const fill = clamp(lerp(REST_FILL, PRESS_FILL, press.value), 0, 1);
      el.style.backgroundColor = `color-mix(in srgb, var(--lq-highlight) ${fill * 100}%, transparent)`;
    }
    if (scaleRef.current) {
      const peak = PILL_PEAK * height;
      scaleRef.current.setAttribute(
        'scale',
        `${peak * lerp(REST_RATIO, PRESS_RATIO, press.value)}`,
      );
    }
  }, [engine, height]);

  const paintRef = React.useRef(paint);
  paintRef.current = paint;
  const loopRef = React.useRef<ReturnType<typeof createSpringLoop> | null>(null);
  loopRef.current ??= createSpringLoop(
    [engine.x, engine.w, engine.press, engine.visible, engine.stretch],
    () => paintRef.current(),
  );
  const loop = loopRef.current;

  // Maps are keyed on size, so they are built once per box the pill settles at.
  // Every item in a bar is the same width, so in practice that is once.
  React.useEffect(() => {
    if (!lens || width === 0 || !supportsRefraction()) return;
    hasLens.current = true;
    setMaps(
      buildLensMaps({
        width,
        height,
        radius: height / 2,
        bezel: PILL_BEZEL * (height / 2),
        surface: LIP,
        dpr: Math.min(window.devicePixelRatio || 1, 3),
      }),
    );
  }, [height, lens, width]);

  React.useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    loop.reduced = motion.matches;
    const onMotion = () => (loop.reduced = motion.matches);
    motion.addEventListener('change', onMotion);
    return () => {
      motion.removeEventListener('change', onMotion);
      loop.stop();
    };
  }, [loop]);

  React.useImperativeHandle(
    forwarded,
    () => ({
      place(x, w, jump) {
        setWidth(w);
        if (jump || !engine.placed) {
          engine.placed = true;
          engine.x.value = engine.x.target = x;
          engine.w.value = engine.w.target = w;
          paint();
          return;
        }
        loop.settle(engine.x, x);
        loop.settle(engine.w, w);
      },
      press(on) {
        loop.settle(engine.press, on ? 1 : 0);
      },
      show(on) {
        loop.settle(engine.visible, on ? 1 : 0);
      },
    }),
    [engine, loop, paint],
  );

  return (
    <>
      {maps && (
        <LensFilter
          id={filterId}
          maps={maps}
          width={width}
          height={height}
          scale={PILL_PEAK * height * REST_RATIO}
          blur={0}
          specularOpacity={0.42}
          specularSaturation={5}
          scaleRef={scaleRef}
        />
      )}
      <span
        ref={elementRef}
        aria-hidden
        style={{
          height,
          borderRadius: height / 2,
          opacity: 0,
          ...(maps
            ? { backdropFilter: `url(#${filterId})`, WebkitBackdropFilter: `url(#${filterId})` }
            : null),
        }}
        className={cn(
          'pointer-events-none absolute top-0 left-0 z-0',
          'shadow-[inset_0_1px_0_var(--lq-rim-hi),inset_0_0_0_0.5px_var(--lq-rim-lo)]',
        )}
      />
    </>
  );
});

/* -------------------------------------------------------------------------- */
/* Bar                                                                         */
/* -------------------------------------------------------------------------- */

export interface TabBarProps extends BaseTabs.Root.Props {
  /** Overrides for the bar's own glass (radius, refraction, bezel…). */
  glass?: Partial<LiquiGlassProps>;
}

/**
 * Splits the search button out of the run of tabs.
 *
 * Apple puts it at the trailing end in a capsule of its own, and the separation
 * is the point — it is a mode rather than a destination. Detecting the child
 * type keeps that out of the consumer's markup: everything is written in order
 * and the bar decides what belongs where. It also has to be lifted out of the
 * tablist entirely, because it is not a tab.
 */
function splitSearch(children: React.ReactNode) {
  const all = React.Children.toArray(children);
  const search = all.filter((c) => React.isValidElement(c) && c.type === TabBarSearch);
  return { items: all.filter((c) => !search.includes(c)), search };
}

export function TabBar({ glass, className, children, ...props }: TabBarProps) {
  const { items, search } = splitSearch(children);
  const searchProps = React.isValidElement<TabBarSearchProps>(search[0])
    ? search[0].props
    : undefined;

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = searchProps?.open ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (searchProps?.open === undefined) setUncontrolledOpen(next);
      searchProps?.onOpenChange?.(next);
    },
    [searchProps],
  );

  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const fieldRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLSpanElement | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const capsuleRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const pill = React.useRef<PillHandle>(null);
  const searchPill = React.useRef<PillHandle>(null);
  /** The item under the finger, and the content span that sinks with it. */
  const pressedItem = React.useRef<HTMLElement | null>(null);
  const sunk = React.useRef<HTMLElement | null>(null);

  /**
   * How far the field has expanded, 0…1, and the row width it expands across.
   *
   * Overdamped: a search field that overshoots its own width and settles back
   * reads as a glitch rather than as a spring, because the thing it is
   * animating is a hole in a clip rather than an object with mass.
   */
  const expand = React.useRef(spring(700, 52)).current;
  const rowWidth = React.useRef(0);
  const barWidth = React.useRef(0);

  /**
   * One clock for the whole transition.
   *
   * Everything here used to be split between a spring and a pair of CSS
   * transitions, and that is most of what made it read wrong: the bar faded on
   * one curve while the field opened on another, so the two halves of a single
   * gesture drifted apart in the middle of it.
   */
  const paintField = React.useCallback(() => {
    const field = fieldRef.current;
    const t = expand.value;
    /** The button's own footprint, which is where the field starts and ends. */
    const seat = ITEM_H + BAR_PAD * 2;

    // Where the field's left edge is, in row coordinates. Everything else in
    // the transition is measured against it.
    const hidden = Math.max(rowWidth.current - seat, 0) * (1 - t);

    if (field) {
      // Revealed from the right, out of the button's footprint, so the field
      // grows from it rather than appearing over it. `round` keeps the moving
      // edge a capsule instead of a straight cut.
      field.style.clipPath = `inset(0 0 0 ${hidden}px round ${BAR_H / 2}px)`;
      // Opaque from the first frame. Fading it in was the second thing that
      // read wrong: the button was still there underneath, so the transition
      // began as two capsules stacked in one place.
      field.style.opacity = '1';
      // Keyed on the target, not the value. Hiding a closed field keeps a
      // backdrop-filter off the compositor, but an *opening* one has to be
      // visible on the same tick the effect below focuses it — you cannot focus
      // something that is `visibility: hidden`, and it fails silently.
      field.style.visibility = t < 0.001 && expand.target === 0 ? 'hidden' : 'visible';
      field.style.pointerEvents = t > 0.9 ? 'auto' : 'none';
    }
    // Everything written on the field arrives and leaves together, and it has
    // to be gone before the clip is back down to the button's footprint —
    // otherwise the closing frames show the word "Cancel" sitting inside what
    // is about to be a round search button.
    const ink = Math.max(t * 1.9 - 0.5, 0);
    if (contentRef.current) {
      // Carried in on the reveal, at the same rate, so the icon arrives with
      // the edge that uncovered it rather than after it.
      contentRef.current.style.translate = `${(1 - t) * seat * 0.6}px 0`;
      contentRef.current.style.opacity = `${ink}`;
    }
    if (cancelRef.current) cancelRef.current.style.opacity = `${ink}`;
    // The button hands over inside its own footprint. The field's right end is
    // already sitting exactly on top of it from the first frame, so this is not
    // a fade anyone sees — it is only here because the field is frosted heavier
    // and two panes of glass in one place would read denser than one.
    if (capsuleRef.current) {
      capsuleRef.current.style.opacity = `${Math.max(1 - t * 8, 0)}`;
    }
    // The bar is *wiped* by the advancing edge, not faded underneath it.
    //
    // This is the thing that made the whole transition read wrong. Fading the
    // bar on its own curve meant it had vanished within 60ms while the reveal
    // still had 250ms to run: the old state blinked out, and then the new one
    // slid in over the hole it left. Clipping it to the same edge makes one
    // gesture out of two — the field does not replace the bar, it eats it, and
    // every pixel changes hands at the moment the edge crosses it.
    if (barRef.current) {
      const eaten = Math.max(barWidth.current - hidden, 0);
      barRef.current.style.clipPath = `inset(0 ${eaten}px 0 0 round ${BAR_H / 2}px)`;
      // Dissolved over the last stretch rather than cut off at the end. The
      // clip's own corner radius turns the final sliver of a capsule into a
      // crescent, which is a shape nothing else on screen has; fading it out
      // across 80px means the edge has taken it before it can become one.
      barRef.current.style.opacity = `${Math.min(hidden / 80, 1)}`;
    }
  }, [expand]);

  const paintFieldRef = React.useRef(paintField);
  paintFieldRef.current = paintField;
  const fieldLoopRef = React.useRef<ReturnType<typeof createSpringLoop> | null>(null);
  fieldLoopRef.current ??= createSpringLoop([expand], () => paintFieldRef.current());
  const fieldLoop = fieldLoopRef.current;

  React.useEffect(() => {
    fieldLoop.settle(expand, open ? 1 : 0);
    // Paint before focusing, so the field is already visible on this tick.
    paintFieldRef.current();
    // Focus is the point of this style of search tab: Apple's guidance is that
    // tapping it "brings focus to the search field and displays the keyboard".
    // Going back to the trigger on the way out keeps the keyboard path whole.
    if (open) inputRef.current?.focus();
    else if (document.activeElement === inputRef.current) triggerRef.current?.focus();
  }, [expand, fieldLoop, open]);

  const isSearch = (el: Element | null) => !!el?.closest('[data-tabbar-search]');

  /**
   * Where the pill belongs right now: under the finger if there is one, on the
   * selected tab otherwise.
   *
   * Moving it on press rather than on activation is what makes every tap show
   * the lens, not just a tap on the tab you are already on. If the press is
   * released somewhere else the tab never activates and this puts the pill
   * back, so the anticipation costs nothing when it guesses wrong.
   */
  const settle = React.useCallback((target?: HTMLElement | null) => {
    const row = rowRef.current;
    if (!row) return;
    // Sized once, and never moved again: the search pill has no resting place
    // to travel to. It is only ever placed so that its maps exist before the
    // first press — a pill that has never been sized has none, and the press
    // would open a lens that is still decoding.
    const trigger = row.querySelector<HTMLElement>('[data-tabbar-search] button');
    if (trigger?.offsetWidth) searchPill.current?.place(0, trigger.offsetWidth, true);

    const item = target ?? row.querySelector<HTMLElement>('[role="tab"][data-active]') ?? null;
    if (!item || item.offsetWidth === 0) return;
    pill.current?.place(item.offsetLeft, item.offsetWidth);
    // Always on: unlike the trigger's, this pill marks a selection, and there
    // is always exactly one tab selected.
    pill.current?.show(true);
  }, []);

  React.useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measureRow = () => {
      rowWidth.current = row.offsetWidth;
      barWidth.current = barRef.current?.offsetWidth ?? 0;
    };
    measureRow();
    paintField();
    settle();
    const observer = new MutationObserver(() => {
      if (!pressedItem.current) settle();
    });
    observer.observe(row, { attributes: true, subtree: true, attributeFilter: ['data-active'] });
    // A font swap or a container resize moves every box under the pill without
    // touching a single attribute.
    const resize = new ResizeObserver(() => {
      measureRow();
      paintField();
      settle();
    });
    resize.observe(row);
    for (const tab of row.querySelectorAll('[role="tab"]')) resize.observe(tab);
    return () => {
      observer.disconnect();
      resize.disconnect();
    };
  }, [paintField, settle]);

  const release = React.useCallback(() => {
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', release);
    pill.current?.press(false);
    searchPill.current?.press(false);
    searchPill.current?.show(false);
    if (sunk.current) sunk.current.style.scale = '1';
    pressedItem.current = null;
    sunk.current = null;
    // After the click, so the pill lands on whatever the tap actually selected
    // rather than bouncing back to the old tab and forward again.
    setTimeout(() => settle(), 0);
  }, [settle]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (open) return;
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-tabbar-press]');
    if (!item || item.hasAttribute('data-disabled') || (item as HTMLButtonElement).disabled) return;
    if (sunk.current) sunk.current.style.scale = '1';
    pressedItem.current = item;
    sunk.current = item.firstElementChild as HTMLElement | null;
    if (sunk.current) sunk.current.style.scale = `${1 - PRESS_SINK}`;

    if (isSearch(item)) {
      // Shown for exactly as long as the finger is down. The trigger has no
      // state to sit in, so neither does its pill.
      searchPill.current?.show(true);
      searchPill.current?.press(true);
    } else {
      settle(item);
      pill.current?.press(true);
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  };

  return (
    <BaseTabs.Root {...props}>
      {/* The row is not the tablist. The tablist is the bar, and the trigger
          beside it is a button — putting both under one `role="tablist"` would
          tell a screen reader the search button is a tab that is never
          selected. */}
      <div
        ref={rowRef}
        onPointerDown={onPointerDown}
        className={cn('relative inline-flex max-w-full items-center gap-2 select-none', className)}
      >
        <LiquiGlass
          elevated
          {...BAR_GLASS}
          {...glass}
          ref={barRef}
          inert={open || undefined}
          className="min-w-0"
          contentClassName="p-[6px]"
        >
          {/* `isolate` keeps the pill's stacking inside the bar. It is safe next
              to `backdrop-filter`: isolation does not make an element a backdrop
              root in Chromium, so the pill still reaches the page. */}
          <BaseTabs.List className="relative isolate flex items-stretch">
            <Pill ref={pill} height={ITEM_H} />
            {items}
          </BaseTabs.List>
        </LiquiGlass>

        {search.length > 0 && (
          <LiquiGlass
            elevated
            {...BAR_GLASS}
            {...glass}
            ref={capsuleRef}
            inert={open || undefined}
            contentClassName="p-[6px]"
          >
            <div
              className="relative isolate flex items-stretch"
              data-tabbar-search
              onClickCapture={() => setOpen(true)}
              ref={(node) => {
                triggerRef.current = node?.querySelector('button') ?? null;
              }}
            >
              <Pill ref={searchPill} height={ITEM_H} />
              {search}
            </div>
          </LiquiGlass>
        )}

        {/* The field the trigger expands into: one more fixed-size surface,
            laid over the whole row and revealed by a clip. It is in the layout
            the whole time so the kernel measures it once. */}
        {searchProps && (
          <LiquiGlass
            ref={fieldRef}
            elevated
            {...FIELD_GLASS}
            {...glass}
            style={{ visibility: 'hidden', opacity: 0 }}
            className="absolute inset-0"
            contentClassName="flex h-full items-center gap-2 px-4"
          >
            {/* Carried in on the reveal. Without this the icon and the
                placeholder are simply *there* the moment the clip uncovers
                them, which reads as a cross-fade rather than as one thing
                growing out of another. */}
            <span
              ref={contentRef}
              className="flex min-w-0 flex-1 items-center gap-2"
              style={{ translate: `${ITEM_H}px 0` }}
            >
            <span className="shrink-0 text-[var(--lq-text-dim)] [&_svg]:size-[19px]">
              {searchProps.icon}
            </span>
            <input
              ref={inputRef}
              type="search"
              value={searchProps.query}
              onChange={(event) => searchProps.onQueryChange?.(event.target.value)}
              placeholder={searchProps.placeholder ?? 'Search'}
              aria-label={
                typeof searchProps.children === 'string' ? searchProps.children : 'Search'
              }
              // Escape is the way out of a transient mode, and the trigger takes
              // the focus back so the next Tab lands where it did before.
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation();
                  setOpen(false);
                }
              }}
              className={cn(
                'min-w-0 flex-1 border-none bg-transparent font-[inherit] text-[15px]',
                'text-[var(--lq-text)] outline-none placeholder:text-[var(--lq-text-dim)]',
                '[&::-webkit-search-cancel-button]:hidden',
              )}
            />
            </span>
            <button
              ref={cancelRef}
              type="button"
              onClick={() => setOpen(false)}
              style={{ opacity: 0 }}
              className={cn(
                'shrink-0 cursor-default rounded-full border-none bg-transparent px-1',
                'font-[inherit] text-[14px] font-medium text-[var(--lq-accent)] outline-none',
                'focus-visible:shadow-[0_0_0_2px_var(--lq-accent)]',
              )}
            >
              Cancel
            </button>
          </LiquiGlass>
        )}
      </div>
    </BaseTabs.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* Items                                                                       */
/* -------------------------------------------------------------------------- */

export interface TabBarItemProps extends BaseTabs.Tab.Props {
  /** The tab's symbol. Prefer a filled one — Apple's guidance, and it reads. */
  icon: React.ReactNode;
  /**
   * A count, or `true` for a bare dot. Reserve it for information that warrants
   * attention; a badge on everything means a badge on nothing.
   */
  badge?: number | boolean;
  /** What the badge announces. Defaults to "3 new items" / "has updates". */
  badgeLabel?: string;
}

/**
 * Selection is a colour, not a brightness.
 *
 * Every item sits at full contrast and the selected one turns accent — which is
 * what the platform does, and it is a different idea from the one this started
 * with. Dimming the four you are not on says "these are less important"; it
 * makes a bar of five destinations read as one destination and four shadows,
 * and it costs legibility on exactly the items someone is trying to navigate
 * to. The pill and the accent carry the state on their own.
 */
const ITEM_CLASS = cn(
  'relative z-1 flex cursor-default items-center justify-center',
  'rounded-full border-none bg-transparent font-[inherit] outline-none',
  'text-[var(--lq-text)] transition-colors duration-200',
  'data-[active]:text-[var(--lq-accent)]',
  'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
  'data-[disabled]:opacity-45',
);

export function TabBarItem({
  icon,
  badge,
  badgeLabel,
  children,
  className,
  ...props
}: TabBarItemProps) {
  return (
    <BaseTabs.Tab
      {...props}
      data-tabbar-press
      className={cn(ITEM_CLASS, 'min-w-[68px] flex-1 px-3', className)}
      style={{ height: ITEM_H }}
    >
      {/* The sink target. Scaling the button would move the box the pill is
          measured against, so the press scales its contents instead. */}
      <span className="pointer-events-none flex flex-col items-center gap-[3px] transition-[scale] duration-150">
        <span className="relative flex items-center justify-center [&_svg]:size-[22px]">
          {icon}
          {badge !== undefined && badge !== false && (
            <span
              aria-hidden
              className={cn(
                'absolute -top-1 -right-2 flex items-center justify-center rounded-full',
                'bg-[var(--lq-danger)] font-semibold text-white tabular-nums',
                'shadow-[0_0_0_1.5px_color-mix(in_srgb,var(--lq-text)_12%,transparent)]',
                badge === true
                  ? 'size-[9px]'
                  : 'h-[16px] min-w-[16px] px-[4px] text-[10px] leading-none',
              )}
            >
              {badge === true ? '' : badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
        <span className="text-[11px] leading-none font-semibold whitespace-nowrap">{children}</span>
        {/* Drawn over the icon, the badge lands before the label and the tab
            announces as "3 Saved". Hidden there and restated here it reads
            "Saved 3 new items". No punctuation: name computation joins the
            parts with a space of its own, so a leading comma would arrive as
            "Saved , 3 new". */}
        {badge !== undefined && badge !== false && (
          <span className="sr-only">
            {badgeLabel ?? (badge === true ? 'has updates' : `${badge} new items`)}
          </span>
        )}
      </span>
    </BaseTabs.Tab>
  );
}

export interface TabBarSearchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The trigger's symbol. */
  icon: React.ReactNode;
  /** Its accessible name. Not drawn — the separation is the label. */
  children: React.ReactNode;
  /** Placeholder for the field the trigger expands into. */
  placeholder?: string;
  /** The query. Leave uncontrolled and read it from `onQueryChange`. */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Whether the field is open. Leave uncontrolled for the default behaviour. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * The search trigger, which Apple puts at the trailing end in a capsule of its
 * own.
 *
 * A `<button>`, deliberately, and not one of the tabs. Search is a mode you
 * open and close, not a section you live in, so there is no state for it to be
 * *in* — and `role="tab"` promises a selected state that this control would
 * never have. Its pill exists only while your finger is down.
 *
 * No visible text either, because the separation is the label: a round button
 * off the end of the bar reads as a trigger on sight. What you pass as children
 * becomes its accessible name. Write it anywhere among the children —
 * `TabBar` finds it and moves it out.
 */
export function TabBarSearch({
  icon,
  children,
  className,
  placeholder: _placeholder,
  query: _query,
  onQueryChange: _onQueryChange,
  open: _open,
  onOpenChange: _onOpenChange,
  ...props
}: TabBarSearchProps) {
  return (
    <button
      type="button"
      {...props}
      data-tabbar-press
      className={cn(ITEM_CLASS, className)}
      style={{ height: ITEM_H, width: ITEM_H }}
    >
      <span className="pointer-events-none flex items-center justify-center transition-[scale] duration-150 [&_svg]:size-[21px]">
        {icon}
        <span className="sr-only">{children}</span>
      </span>
    </button>
  );
}
