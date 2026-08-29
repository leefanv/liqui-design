'use client';

import { Input } from '@/registry/liqui/ui/input';

/**
 * The input itself is transparent — every pixel you can see belongs to the
 * surface around it. Tab into one and watch the focus ring appear on the glass
 * rather than on the element that has focus.
 */
export default function InputDemo() {
  return (
    <div className="flex w-72 flex-col gap-3">
      <Input placeholder="acme-design" aria-label="Workspace name" />
      <Input defaultValue="lena@liqui.design" aria-label="Email" />
      <Input placeholder="Not editable" aria-label="Region" disabled />
    </div>
  );
}
