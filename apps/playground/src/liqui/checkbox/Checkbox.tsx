import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import './checkbox.css';

/**
 * liqui Checkbox — Base UI checkbox as a LiquiGlass surface. At ~20px the box
 * is barely wider than the bezel, so this is the smallest surface the lens is
 * asked to render: radius/bezel/refraction scale down hard from the popup
 * defaults, and it's the first place an over-driven refraction dial smears.
 */

const CHECKBOX_GLASS: LiquiGlassProps = {
  radius: 7,
  blur: 1,
  refraction: 20,
  bezel: 6,
};

const CheckIcon = (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
    <path
      d="M2 6.4 4.7 9.1 10 3.1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IndeterminateIcon = (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
    <path d="M2.5 6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export interface CheckboxProps extends BaseCheckbox.Root.Props {
  glass?: Partial<LiquiGlassProps>;
}

export function Root({ glass, className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      {...props}
      className={['lq-checkbox', className ?? ''].join(' ').trim()}
      render={<LiquiGlass {...CHECKBOX_GLASS} {...glass} />}
    >
      <BaseCheckbox.Indicator className="lq-checkbox-indicator">
        {props.indeterminate ? IndeterminateIcon : CheckIcon}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}

/** Row wrapper that pairs the box with its text and keeps the hit area sane. */
export function Label({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label {...props} className={['lq-checkbox-row', className ?? ''].join(' ').trim()}>
      {children}
    </label>
  );
}
