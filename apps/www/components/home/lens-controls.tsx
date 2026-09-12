'use client';

import * as React from 'react';

import { Wallpaper } from '@/components/wallpaper';
import {
  Slider,
  SliderControl,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from '@/registry/liqui/ui/slider';
import { Switch, SwitchLabel } from '@/registry/liqui/ui/switch';

/**
 * The second argument, and a different one from the stage above.
 *
 * That stage is a glass *surface*: it is glass the whole time, and you drag it
 * over an edge to see the edge bend. These two are not surfaces. They carry
 * their own lens and it is hidden until you touch them — at rest each is an
 * opaque white pill, and pressing one makes it swell past its track, thin to a
 * tenth, and turn into a lens with the backdrop bending through it. There is
 * nothing to drag; the interaction is the reveal.
 *
 * They sit directly on the backdrop rather than on a panel, and that is not a
 * layout preference. `backdrop-filter` samples whatever is painted behind an
 * element, and behind a control on a frosted panel is the panel's own tint — a
 * flat wash with nothing in it to bend. A lens needs edges underneath, which is
 * why this stage is full-bleed backdrop and why the components ship a
 * `lens={false}` escape hatch for the times they end up on glass anyway.
 *
 * The wallpaper supplies those edges as the ridge line and the sand's ripple
 * texture, rather than as the drawn grid this used to stand on. The grid
 * guaranteed a line under every control; a photograph does not, so what is
 * under a given thumb now depends on the crop — which is also the honest
 * version, since that is what a lens meets in an application.
 */
export function LensControls() {
  const [wifi, setWifi] = React.useState(true);
  const [lowPower, setLowPower] = React.useState(false);
  const [level, setLevel] = React.useState(58);

  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-fd-border">
      {/* No `data-theme` pin. The wallpaper ships as a day/night pair and
          follows the page, so the controls have to be lit to match the picture
          they are sitting on. */}
      <Wallpaper />

      {/* Two columns on a wide screen, because one narrow stack centred in a
          full-bleed stage leaves most of the picture doing nothing. Side by
          side, both halves sit over the ridge and there is an edge near a
          control on each. */}
      <div className="relative flex min-h-[15rem] flex-col justify-center gap-8 px-6 py-10 sm:px-10 md:min-h-[17rem] md:flex-row md:items-center md:gap-14">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <SwitchLabel>
            Wi-Fi
            <Switch checked={wifi} onCheckedChange={setWifi} />
          </SwitchLabel>
          <SwitchLabel>
            Low Power Mode
            <Switch checked={lowPower} onCheckedChange={setLowPower} />
          </SwitchLabel>
        </div>

        <div className="min-w-0 flex-1">
          <Slider
            value={level}
            onValueChange={(value) => setLevel(Array.isArray(value) ? value[0] : value)}
          >
            <div className="flex items-baseline justify-between">
              <SliderLabel>Brightness</SliderLabel>
              <SliderValue />
            </div>
            <SliderControl>
              <SliderTrack>
                <SliderThumb />
              </SliderTrack>
            </SliderControl>
          </Slider>
        </div>
      </div>

      <p className="pointer-events-none absolute right-5 bottom-4 text-[11px] tracking-[0.16em] uppercase text-white/45 select-none">
        press and hold
      </p>
    </div>
  );
}
