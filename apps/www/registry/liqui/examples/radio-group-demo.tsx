'use client';

import * as React from 'react';

import { Radio, RadioGroup, RadioLabel } from '@/registry/liqui/ui/radio-group';

export default function RadioGroupDemo() {
  const [quality, setQuality] = React.useState('balanced');

  return (
    <RadioGroup
      className="w-64"
      value={quality}
      onValueChange={(value) => setQuality(value as string)}
      aria-label="Export quality"
    >
      <RadioLabel>
        <Radio value="fast" />
        Fast
      </RadioLabel>
      <RadioLabel>
        <Radio value="balanced" />
        Balanced
      </RadioLabel>
      <RadioLabel>
        <Radio value="best" />
        Best quality
      </RadioLabel>
      <RadioLabel>
        <Radio value="lossless" disabled />
        Lossless (Pro only)
      </RadioLabel>
    </RadioGroup>
  );
}
