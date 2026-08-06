'use client';

import * as React from 'react';
import { LiquiGlass } from '@liqui-design/glass';

import { Backdrop, BACKDROPS, type BackdropId } from '@/components/home/backdrops';
import { cn } from '@/lib/utils';
import { Button } from '@/registry/liqui/ui/button';
import { Checkbox, CheckboxLabel } from '@/registry/liqui/ui/checkbox';
import { Field, FieldControl, FieldLabel } from '@/registry/liqui/ui/field';

/**
 * The home page's argument, made by letting you move the glass rather than by
 * describing it. A still image cannot show refraction — the effect only reads
 * when an edge passes under the bezel — so the surface is draggable and the
 * optics are live.
 *
 * The components inside are the same files `shadcn add` installs, imported from
 * the registry. If this looks right, what you install looks right.
 */

const DEFAULTS = { frost: 0.35, refraction: 150, bezel: 28, blur: 1, specular: 0.7 };

export function GlassStage() {
  const [backdrop, setBackdrop] = React.useState<BackdropId>('aurora');
  const [optics, setOptics] = React.useState(DEFAULTS);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [checked, setChecked] = React.useState(true);

  const stageRef = React.useRef<HTMLDivElement>(null);
  const origin = React.useRef({ px: 0, py: 0, x: 0, y: 0 });

  const set = <K extends keyof typeof DEFAULTS>(key: K, value: number) =>
    setOptics((o) => ({ ...o, [key]: value }));

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
      data-theme="dark"
    >
      <Backdrop id={backdrop} />

      {/* The surface under test */}
      <LiquiGlass
        elevated
        radius={24}
        frost={optics.frost}
        refraction={optics.refraction}
        bezel={optics.bezel}
        blur={optics.blur}
        specular={optics.specular}
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
        <div className="flex flex-wrap gap-1.5">
          {BACKDROPS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBackdrop(b.id)}
              title={b.hint}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] backdrop-blur-md transition',
                backdrop === b.id
                  ? 'border-white/70 bg-white/25 text-white'
                  : 'border-white/25 bg-black/25 text-white/70 hover:bg-black/40',
              )}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/20 bg-black/35 p-3 backdrop-blur-md">
          <Dial label="Frost" value={optics.frost} min={0} max={1} step={0.01} onChange={(v) => set('frost', v)} />
          <Dial label="Refraction" value={optics.refraction} min={0} max={260} step={1} unit="px" onChange={(v) => set('refraction', v)} />
          <Dial label="Bezel" value={optics.bezel} min={4} max={48} step={1} unit="px" onChange={(v) => set('bezel', v)} />
          <Dial label="Blur" value={optics.blur} min={0} max={12} step={0.5} unit="px" onChange={(v) => set('blur', v)} />
          <button
            type="button"
            onClick={() => {
              setOptics(DEFAULTS);
              setPos({ x: 0, y: 0 });
            }}
            className="mt-1 w-full rounded-lg border border-white/20 py-1 text-[11px] text-white/70 transition hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function Dial({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mb-2 block text-[11px] text-white/80 last:mb-0">
      <span className="flex justify-between">
        {label}
        <span className="tabular-nums text-white/55">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[#6f9dff]"
      />
    </label>
  );
}
