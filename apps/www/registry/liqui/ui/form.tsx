'use client';

import { Form as BaseForm } from '@base-ui/react/form';

import { cn } from '@/lib/utils';

/**
 * liqui Form — the one component here with nothing to look at.
 *
 * There is no surface, and there should not be. A form is a set of controls
 * that each already carry their own glass; wrapping them in one more would put
 * every field's lens over a backdrop made of the wrapper's tint — the argument
 * spelled out on [Fieldset](/docs/components/fieldset), which is the same
 * decision one level down.
 *
 * What it does carry is `errors`. Base UI's form takes a record keyed by field
 * `name` and routes each message to that field's `Field.Error`, then clears it
 * when the field next changes. That is the piece worth having: it is what makes
 * a server response light up the right control instead of a banner at the top
 * of the page, and it is why this is a component rather than a `<form>` you
 * write yourself.
 *
 * Everything else here is a rhythm — the gap between fields, which is the only
 * visual decision a form is entitled to make.
 */
export function Form({ className, ...props }: BaseForm.Props) {
  return <BaseForm {...props} className={cn('flex w-full flex-col gap-4', className)} />;
}
