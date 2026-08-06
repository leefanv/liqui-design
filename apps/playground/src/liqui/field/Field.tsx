import { Field as BaseField } from '@base-ui/react/field';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import './field.css';

/**
 * liqui Field — Base UI field with the control sitting on its own LiquiGlass
 * surface. Small controls are the hard case for the lens: the bezel is a large
 * fraction of the box, so radius/bezel/refraction get scaled down from the
 * popup defaults.
 */

const CONTROL_GLASS: LiquiGlassProps = {
  radius: 12,
  blur: 1,
  refraction: 60,
  bezel: 12,
};

export function Root({
  className,
  ...props
}: BaseField.Root.Props & { className?: string }) {
  return (
    <BaseField.Root
      {...props}
      className={['lq-field', className ?? ''].join(' ').trim()}
    />
  );
}

export function Label(props: BaseField.Label.Props) {
  return <BaseField.Label {...props} className="lq-field-label" />;
}

export function Description(props: BaseField.Description.Props) {
  return <BaseField.Description {...props} className="lq-field-description" />;
}

export function Error(props: BaseField.Error.Props) {
  return <BaseField.Error {...props} className="lq-field-error" />;
}

/**
 * The control and its glass surface. The `<input>` itself stays a plain
 * transparent element inside the glass content layer — making the input the
 * glass root would put the backdrop/tint pseudo-layers inside a replaced
 * element, where they can't render.
 */
export function Control({
  glass,
  ...props
}: BaseField.Control.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <LiquiGlass {...CONTROL_GLASS} {...glass} className="lq-field-control">
      <BaseField.Control {...props} className="lq-field-input" />
    </LiquiGlass>
  );
}

export const Validity = BaseField.Validity;
