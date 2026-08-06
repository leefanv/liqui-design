'use client';

import { Field, FieldControl, FieldError, FieldLabel } from '@/registry/liqui/ui/field';

/**
 * The invalid ring lives on the glass surface, not the input — `has-*` lets the
 * surface react to a state that belongs to its child.
 */
export default function FieldValidation() {
  return (
    <Field className="w-72">
      <FieldLabel>Email</FieldLabel>
      <FieldControl type="email" required placeholder="you@example.com" />
      <FieldError match="valueMissing">An email is required.</FieldError>
      <FieldError match="typeMismatch">That doesn&apos;t look like an email.</FieldError>
    </Field>
  );
}
