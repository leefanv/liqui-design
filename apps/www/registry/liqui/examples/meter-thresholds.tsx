'use client';

import * as React from 'react';

import { Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue } from '@/registry/liqui/ui/meter';
import { Slider, SliderControl, SliderThumb, SliderTrack } from '@/registry/liqui/ui/slider';

/**
 * The fill is `--lq-accent`, so a threshold is a token override rather than a
 * prop — the same move Checkbox makes on `data-[checked]`, and the reason this
 * component ships no `tone`.
 *
 * Drag the slider past 70 and then past 90. The wash changes colour and the
 * *width* still jumps, because only the colour is a transition: the reading is
 * wherever you just put it.
 */
function toneFor(value: number) {
  if (value >= 90) return 'var(--lq-danger)';
  if (value >= 70) return '#f5a524';
  return 'var(--lq-accent)';
}

export default function MeterThresholds() {
  const [value, setValue] = React.useState(58);

  return (
    <div className="flex w-72 flex-col gap-7">
      <Meter value={value} style={{ '--lq-accent': toneFor(value) } as React.CSSProperties}>
        <div className="flex items-baseline justify-between">
          <MeterLabel>Disk</MeterLabel>
          <MeterValue />
        </div>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </Meter>

      <Slider
        value={value}
        onValueChange={(next) => setValue(next as number)}
        aria-label="Disk usage"
      >
        <SliderControl>
          <SliderTrack>
            <SliderThumb />
          </SliderTrack>
        </SliderControl>
      </Slider>
    </div>
  );
}
