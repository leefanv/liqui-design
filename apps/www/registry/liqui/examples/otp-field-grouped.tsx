'use client';

import * as React from 'react';

import { OTPField, OTPFieldSeparator, OTPFieldSlot } from '@/registry/liqui/ui/otp-field';

/**
 * Grouped `123-456`, with the separator cut short on purpose: a full-height rule
 * between two lenses reads as a seventh slot with nothing in it.
 *
 * `mask` turns the digits into dots without changing anything optical — the
 * slots are the same six boxes, so they are still the same one map.
 */
export default function OTPFieldGrouped() {
  const id = React.useId();

  return (
    <div className="flex flex-col items-start gap-2">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-[var(--lq-text)]">
        Recovery code
      </label>
      <OTPField id={id} length={6} mask className="flex items-center">
        <OTPFieldSlot aria-label="Character 1 of 6" />
        <OTPFieldSlot aria-label="Character 2 of 6" className="ml-2" />
        <OTPFieldSlot aria-label="Character 3 of 6" className="ml-2" />
        <OTPFieldSeparator />
        <OTPFieldSlot aria-label="Character 4 of 6" />
        <OTPFieldSlot aria-label="Character 5 of 6" className="ml-2" />
        <OTPFieldSlot aria-label="Character 6 of 6" className="ml-2" />
      </OTPField>
    </div>
  );
}
