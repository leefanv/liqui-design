'use client';

import {
  Slider,
  SliderControl,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from '@/registry/liqui/ui/slider';

export default function SliderRange() {
  return (
    <Slider className="w-72" defaultValue={[24, 78]} minStepsBetweenValues={4}>
      <div className="flex items-baseline justify-between">
        <SliderLabel>Exposure range</SliderLabel>
        <SliderValue>{(formatted) => `${formatted[0]} – ${formatted[1]}`}</SliderValue>
      </div>
      <SliderControl>
        <SliderTrack>
          {/* Two lenses on one rail: each thumb is its own surface, and both
              hit the same cached map because they are the same size. */}
          <SliderThumb index={0} getAriaLabel={() => 'Minimum'} />
          <SliderThumb index={1} getAriaLabel={() => 'Maximum'} />
        </SliderTrack>
      </SliderControl>
    </Slider>
  );
}
