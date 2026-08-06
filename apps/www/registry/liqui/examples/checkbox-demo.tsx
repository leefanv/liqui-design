'use client';

import * as React from 'react';

import { Checkbox, CheckboxLabel } from '@/registry/liqui/ui/checkbox';

export default function CheckboxDemo() {
  const [checked, setChecked] = React.useState(true);

  return (
    <div className="flex flex-col gap-3">
      <CheckboxLabel>
        <Checkbox checked={checked} onCheckedChange={setChecked} />
        Show hidden files
      </CheckboxLabel>
      <CheckboxLabel>
        <Checkbox defaultChecked={false} />
        Snap to grid
      </CheckboxLabel>
      <CheckboxLabel>
        <Checkbox indeterminate />
        Partially selected
      </CheckboxLabel>
      <CheckboxLabel>
        <Checkbox disabled />
        Unavailable
      </CheckboxLabel>
    </div>
  );
}
