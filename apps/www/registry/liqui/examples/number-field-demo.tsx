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

export default function NumberFieldDemo() {
  const id = React.useId();

  return (
    <NumberField id={id} defaultValue={24} min={0} max={200} step={2}>
      <NumberFieldLabel htmlFor={id}>Bezel width</NumberFieldLabel>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  );
}
