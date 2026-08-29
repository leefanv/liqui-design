'use client';

import * as React from 'react';

import { Button } from '@/registry/liqui/ui/button';
import { Field, FieldControl, FieldError, FieldLabel } from '@/registry/liqui/ui/field';
import { Form } from '@/registry/liqui/ui/form';

/**
 * The point of `Form` is the `errors` prop. Submit with the handle `admin` and
 * the (pretend) server rejects it — the message lands on that field's own
 * `FieldError`, under that field's own surface, and clears itself the moment
 * you type. No banner, no scroll to the top of the page.
 */
export default function FormDemo() {
  const [errors, setErrors] = React.useState<Record<string, string | string[]>>({});
  const [pending, setPending] = React.useState(false);

  return (
    <Form
      className="w-72"
      errors={errors}
      onSubmit={async (event) => {
        event.preventDefault();
        const handle = String(new FormData(event.currentTarget).get('handle') ?? '');

        setPending(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setPending(false);

        setErrors(handle === 'admin' ? { handle: 'That handle is reserved.' } : {});
      }}
    >
      <Field name="handle">
        <FieldLabel>Handle</FieldLabel>
        <FieldControl required placeholder="try “admin”" />
        <FieldError match="valueMissing">A handle is required.</FieldError>
        <FieldError />
      </Field>

      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Checking…' : 'Claim handle'}
      </Button>
    </Form>
  );
}
