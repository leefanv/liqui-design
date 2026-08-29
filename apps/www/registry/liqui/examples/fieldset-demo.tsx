'use client';

import { Field, FieldControl, FieldDescription, FieldLabel } from '@/registry/liqui/ui/field';
import { Fieldset, FieldsetLegend } from '@/registry/liqui/ui/fieldset';

/**
 * The group has no box around it, on purpose. Every control inside is already a
 * lens, and a panel behind them would be the thing those lenses bend — the page
 * has to stay reachable all the way down.
 */
export default function FieldsetDemo() {
  return (
    <Fieldset className="w-72">
      <FieldsetLegend>Billing address</FieldsetLegend>

      <Field>
        <FieldLabel>Street</FieldLabel>
        <FieldControl placeholder="12 Rue de Rivoli" />
      </Field>

      <Field>
        <FieldLabel>City</FieldLabel>
        <FieldControl placeholder="Paris" />
      </Field>

      <Field>
        <FieldLabel>Postcode</FieldLabel>
        <FieldControl placeholder="75001" />
        <FieldDescription>Used for tax, never shown publicly.</FieldDescription>
      </Field>
    </Fieldset>
  );
}
