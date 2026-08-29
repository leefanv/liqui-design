'use client';

import { Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue } from '@/registry/liqui/ui/meter';

/**
 * Three readings of things that already are. Nothing here animates on mount —
 * a bar sliding into place would be showing a change that never happened.
 */
export default function MeterDemo() {
  return (
    <div className="flex w-72 flex-col gap-6">
      <Meter value={72}>
        <div className="flex items-baseline justify-between">
          <MeterLabel>Storage used</MeterLabel>
          <MeterValue />
        </div>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </Meter>

      <Meter value={0.41} format={{ style: 'percent', maximumFractionDigits: 1 }} max={1}>
        <div className="flex items-baseline justify-between">
          <MeterLabel>Cache hit rate</MeterLabel>
          <MeterValue />
        </div>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </Meter>

      <Meter value={18} max={24}>
        <div className="flex items-baseline justify-between">
          <MeterLabel>Seats</MeterLabel>
          <MeterValue>{(_, value) => `${value} of 24`}</MeterValue>
        </div>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </Meter>
    </div>
  );
}
