'use client';

import {
  Slider,
  SliderControl,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from '@/registry/liqui/ui/slider';

export default function SliderDemo() {
  return (
    <Slider className="w-72" defaultValue={62}>
      <div className="flex items-baseline justify-between">
        <SliderLabel>Volume</SliderLabel>
        <SliderValue />
      </div>
      <SliderControl>
        <SliderTrack>
          <SliderThumb />
        </SliderTrack>
      </SliderControl>
    </Slider>
  );
}
