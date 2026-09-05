'use client';

import * as React from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';

import { createSpringLoop, lerp, spring } from '@/lib/lens';
import { cn } from '@/lib/utils';

/**
 * liqui TabBar — the iOS floating tab bar, where the bar is the lens.
 *
 * This is the fourth time the library has had to answer "which of these two
 * nested boxes gets to refract", and it is the first time the platform answers
 * it for us. Apple's guidance is literal: a tab bar *floats above content at
 * the bottom of the screen*, and its items *rest on a Liquid Glass background
 * that allows content beneath to peek through*. The bar is the glass. So the
 * bar refracts the page scrolling underneath it, and the selection pill inside
 * is a highlight rather than a second lens — a lens there would be sampling the
 * bar's own blurred output and would arrive as a smudge, which is the same trap
 * Switch documents.
 *
 * [Tabs](./tabs.tsx) resolves the same question the other way, and the contrast
 * is the point. A segmented control sits *in* a page and its subject is the
 * thing travelling between segments, so there the strip is a groove and the
 * indicator is the lens. A tab bar sits *over* a page and its subject is the
 * page showing through, so here the bar is the lens and the indicator is paint.
 *
 * That inversion buys something back. Tabs has to force every segment to equal
 * width, because its indicator *is* a lens and the kernel keys a displacement
 * map on size — a pill that resizes mid-slide asks for a new map every frame.
 * This pill is paint, so it can resize freely, and it does: it morphs between
 * labels of different lengths and stretches along its direction of travel in
 * proportion to how fast it is going. That stretch is the whole liquid read.
 */

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/** Padding between the bar's edge and its items — the pill's inset. */
const BAR_PAD = 6;
const ITEM_H = 46;

const BAR_GLASS = {
  radius: (ITEM_H + BAR_PAD * 2) / 2,
  blur: 1,
  refraction: 70,
  bezel: 18,
} satisfies Partial<LiquiGlassProps>;

/* -------------------------------------------------------------------------- */
/* Motion                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * How far the pill stretches at speed, and the speed that gets it there.
 *
 * A pill that only slides reads as a rectangle being moved. The stretch is what
 * makes it read as liquid: it leads with its front edge, thins vertically while
 * it travels, and settles back as it arrives. Tying it to the spring's own
 * velocity rather than to a keyframe means a short hop between neighbours
 * barely deforms and a jump across the whole bar deforms a lot, which is what
 * the eye expects of something with mass.
 */
const STRETCH_MAX = 0.26;
const STRETCH_SPEED = 2600;

/** How far a pressed item's contents sink. */
const PRESS_SINK = 0.1;

/* -------------------------------------------------------------------------- */
/* Bar                                                                         */
/* -------------------------------------------------------------------------- */

export interface TabBarProps extends BaseTabs.Root.Props {
  /** Overrides for the bar's own glass (radius, refraction, bezel…). */
  glass?: Partial<LiquiGlassProps>;
}

export function TabBar({ glass, className, children, ...props }: TabBarProps) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const pillRef = React.useRef<HTMLSpanElement | null>(null);
  const bloomRef = React.useRef<HTMLSpanElement | null>(null);
  /** The item under the finger, and the content span that sinks with it. */
  const pressed = React.useRef<HTMLElement | null>(null);
  const sunk = React.useRef<HTMLElement | null>(null);

  const engine = React.useRef({
    /** Pill left edge and width, in list coordinates. */
    x: spring(520, 40),
    w: spring(520, 40),
    /** 0…1 press depth for whichever item is under the pointer. */
    press: spring(1600, 60),
    /** Bloom box, for a press on an item that is not the selected one. */
    bloomX: 0,
    bloomW: 0,
    /** False until the first measurement, so the pill does not fly in. */
    placed: false,
  }).current;

  const paint = React.useCallback(() => {
    const { x, w, press } = engine;
    const pill = pillRef.current;
    if (pill) {
      // Velocity-driven, so the deformation belongs to the motion rather than
      // to a duration. `scale` takes two values and composes after `translate`,
      // which is why both can be written independently.
      const stretch = Math.min(Math.abs(x.velocity) / STRETCH_SPEED, STRETCH_MAX);
      const squash = pressed.current?.hasAttribute('data-active') ? press.value * 0.05 : 0;
      pill.style.translate = `${x.value}px 0`;
      pill.style.width = `${w.value}px`;
      pill.style.scale = `${1 + stretch - squash} ${1 - stretch * 0.45 - squash}`;
    }
    if (bloomRef.current) {
      bloomRef.current.style.translate = `${engine.bloomX}px 0`;
      bloomRef.current.style.width = `${engine.bloomW}px`;
      bloomRef.current.style.opacity = `${press.value}`;
      bloomRef.current.style.scale = `${lerp(0.82, 1, press.value)}`;
    }
    if (sunk.current) {
      sunk.current.style.scale = `${1 - PRESS_SINK * press.value}`;
    }
  }, [engine]);

  const paintRef = React.useRef(paint);
  paintRef.current = paint;
  const loopRef = React.useRef<ReturnType<typeof createSpringLoop> | null>(null);
  loopRef.current ??= createSpringLoop([engine.x, engine.w, engine.press], () => paintRef.current());
  const loop = loopRef.current;

  /**
   * The selected tab is read out of the DOM rather than tracked in React.
   *
   * Base UI owns the value and marks the active tab with `data-active`, so the
   * attribute is the truth and watching it costs one observer instead of a
   * context, a ref per item, and a second copy of the state to keep in sync. It
   * also means `TabBarItem` stays a styled `Tabs.Tab` with nothing threaded
   * through it.
   */
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    loop.reduced = motion.matches;
    const onMotion = () => (loop.reduced = motion.matches);
    motion.addEventListener('change', onMotion);

    const measure = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][data-active]');
      if (!active || active.offsetWidth === 0) return;
      if (!engine.placed) {
        // First paint lands on the selected tab rather than travelling to it.
        engine.placed = true;
        engine.x.value = engine.x.target = active.offsetLeft;
        engine.w.value = engine.w.target = active.offsetWidth;
        paint();
        return;
      }
      loop.settle(engine.x, active.offsetLeft);
      loop.settle(engine.w, active.offsetWidth);
    };

    measure();
    const observer = new MutationObserver(measure);
    observer.observe(list, { attributes: true, subtree: true, attributeFilter: ['data-active'] });
    // The bar is a capsule of flexible items: a font swap or a container resize
    // moves every box under the pill without touching a single attribute.
    const resize = new ResizeObserver(measure);
    resize.observe(list);
    for (const tab of list.querySelectorAll('[role="tab"]')) resize.observe(tab);

    return () => {
      observer.disconnect();
      resize.disconnect();
      motion.removeEventListener('change', onMotion);
      loop.stop();
    };
  }, [engine, loop, paint]);

  const release = React.useCallback(() => {
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', release);
    loop.settle(engine.press, 0);
  }, [engine, loop]);

  return (
    <BaseTabs.Root {...props}>
      <LiquiGlass
        elevated
        {...BAR_GLASS}
        {...glass}
        className={cn('inline-block max-w-full select-none', className)}
        contentClassName="p-[6px]"
      >
        <BaseTabs.List
          ref={listRef}
          // `isolate` keeps the pill's stacking inside the bar. It is safe next
          // to `backdrop-filter`: isolation does not make an element a backdrop
          // root in Chromium, so the bar's own layers still reach the page.
          className="relative isolate flex items-stretch"
          onPointerDown={(event) => {
            const item = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
            if (!item || item.hasAttribute('data-disabled')) return;
            // The bloom is for pressing a tab you are not on. On the selected
            // one the pill is already there and gets squashed instead — two
            // highlights stacked on the same box just look like a bug.
            engine.bloomX = item.offsetLeft;
            engine.bloomW = item.offsetWidth;
            // Put the last one back before adopting a new one: a second press
            // during the release animation would otherwise strand it sunk.
            if (sunk.current) sunk.current.style.scale = '1';
            pressed.current = item;
            sunk.current = item.firstElementChild as HTMLElement | null;
            loop.settle(engine.press, 1);
            window.addEventListener('pointerup', release);
            window.addEventListener('pointercancel', release);
          }}
        >
          {/* Paint, not glass — see the note at the top of the file. */}
          <span
            ref={pillRef}
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-0 left-0 z-0 h-full rounded-full',
              'bg-[color-mix(in_srgb,var(--lq-highlight)_82%,transparent)]',
              'shadow-[inset_0_1px_0_var(--lq-rim-hi),inset_0_0_0_0.5px_var(--lq-rim-lo),0_1px_3px_rgba(10,15,40,0.12)]',
            )}
          />
          <span
            ref={bloomRef}
            aria-hidden
            style={{ opacity: 0 }}
            className={cn(
              'pointer-events-none absolute top-0 left-0 z-0 h-full rounded-full',
              'bg-[color-mix(in_srgb,var(--lq-highlight)_58%,transparent)]',
            )}
          />
          {children}
        </BaseTabs.List>
      </LiquiGlass>
    </BaseTabs.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* Item                                                                        */
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
      className={cn(
        'relative z-1 flex min-w-[68px] flex-1 cursor-default items-center justify-center',
        'rounded-full border-none bg-transparent px-3 font-[inherit] outline-none',
        'text-[var(--lq-text-dim)] transition-colors duration-200',
        'hover:text-[var(--lq-text)] data-[active]:text-[var(--lq-text)]',
        'focus-visible:shadow-[inset_0_0_0_2px_var(--lq-accent)]',
        'data-[disabled]:opacity-45',
        className,
      )}
      style={{ height: ITEM_H }}
    >
      {/* The sink target. Scaling the button itself would move the box the pill
          is measured against, so the press scales its contents instead. */}
      <span className="pointer-events-none flex flex-col items-center gap-[3px]">
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
        {/* The badge is decoration to a screen reader unless it is spoken in
            the right order — drawn over the icon it lands before the label, and
            the tab announces as "3 Saved". Hidden there and restated here, it
            reads "Saved 3 new items".
            
            No punctuation in it on purpose: name computation joins the parts
            with a space of its own, so a leading comma would arrive as
            "Saved , 3 new". Pass `badgeLabel` for wording of your own. */}
        {badge !== undefined && badge !== false && (
          <span className="sr-only">
            {badgeLabel ?? (badge === true ? 'has updates' : `${badge} new items`)}
          </span>
        )}
      </span>
    </BaseTabs.Tab>
  );
}
