'use client';

import { Field, FieldControl, FieldDescription, FieldLabel } from '@/registry/liqui/ui/field';

export default function FieldDemo() {
  return (
    <Field className="w-72">
      <FieldLabel>Workspace name</FieldLabel>
      <FieldControl placeholder="acme-design" />
      <FieldDescription>Lowercase letters, numbers and dashes.</FieldDescription>
    </Field>
  );
}
