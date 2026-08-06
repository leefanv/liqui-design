import { Button as BaseButton } from '@base-ui/react/button';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import './button.css';

/**
 * liqui Button — Base UI button rendered as a LiquiGlass surface.
 *
 * The glass anatomy (backdrop/tint/specular layers + a content wrapper) can't
 * live inside a native `<button>`: its content model is phrasing content, so
 * the wrapper div would be invalid HTML. `nativeButton={false}` is Base UI's
 * supported escape — useButton then supplies `role="button"`, `tabIndex`, and
 * the Enter/Space handlers itself. The one thing it can't give back is
 * implicit form submission, so pass `nativeButton` explicitly (and drop the
 * glass) for a real submit button.
 */

export type ButtonVariant = 'glass' | 'accent' | 'danger';

const BUTTON_GLASS: LiquiGlassProps = {
  radius: 12,
  blur: 1,
  refraction: 45,
  bezel: 11,
};

export interface ButtonProps extends BaseButton.Props {
  variant?: ButtonVariant;
  glass?: Partial<LiquiGlassProps>;
}

export function Button({
  variant = 'glass',
  glass,
  className,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      {...props}
      nativeButton={false}
      className={['lq-button', `lq-button--${variant}`, className ?? '']
        .join(' ')
        .trim()}
      render={<LiquiGlass {...BUTTON_GLASS} {...glass} />}
    />
  );
}
