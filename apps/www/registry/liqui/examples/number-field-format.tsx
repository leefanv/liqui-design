'use client';

import * as React from 'react';

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldLabel,
} from '@/registry/liqui/ui/number-field';

export default function NumberFieldFormat() {
  const id = React.useId();

  return (
    <NumberField
      id={id}
      defaultValue={0.35}
      min={0}
      max={1}
      step={0.05}
      format={{ style: 'percent', maximumFractionDigits: 0 }}
    >
      <NumberFieldLabel htmlFor={id}>Frost</NumberFieldLabel>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  );
}
