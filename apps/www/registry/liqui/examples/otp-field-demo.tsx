'use client';

import * as React from 'react';

import { OTPField, OTPFieldSlots } from '@/registry/liqui/ui/otp-field';

/**
 * Six surfaces, one displacement map. They are the same box at the same optics,
 * and the cache is keyed on exactly that pair — so the row costs what a single
 * slot costs.
 *
 * Type into it and watch the filled slots retint rather than fill: the accent
 * arrives *as glass*, and the bezel is still bending the backdrop behind every
 * digit.
 */
const LENGTH = 6;

export default function OTPFieldDemo() {
  const id = React.useId();

  return (
    <div className="flex flex-col items-start gap-2">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-[var(--lq-text)]">
        Verification code
      </label>
      <OTPField id={id} length={LENGTH} defaultValue="42" className="flex items-center gap-2">
        <OTPFieldSlots length={LENGTH} />
      </OTPField>
      <p className="m-0 text-[12px] text-[var(--lq-text-dim)]">
        Enter the {LENGTH}-digit code we sent to your device.
      </p>
    </div>
  );
}
