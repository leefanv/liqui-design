'use client';

import * as React from 'react';

import { Checkbox, CheckboxLabel } from '@/registry/liqui/ui/checkbox';
import { CheckboxGroup } from '@/registry/liqui/ui/checkbox-group';
import { Fieldset, FieldsetLegend } from '@/registry/liqui/ui/fieldset';

/**
 * Four lenses and nothing behind them but the page. The group is a stack and a
 * gap — a panel here would be the backdrop each box refracts, and the boxes
 * would end up bending the group instead of the wallpaper.
 */
export default function CheckboxGroupDemo() {
  const [value, setValue] = React.useState(['https', 'ssh']);

  return (
    <Fieldset className="w-64">
      <FieldsetLegend>Allowed protocols</FieldsetLegend>
      <CheckboxGroup value={value} onValueChange={setValue}>
        <CheckboxLabel>
          <Checkbox value="https" />
          HTTPS
        </CheckboxLabel>
        <CheckboxLabel>
          <Checkbox value="ssh" />
          SSH
        </CheckboxLabel>
        <CheckboxLabel>
          <Checkbox value="ftp" />
          FTP
        </CheckboxLabel>
        <CheckboxLabel>
          <Checkbox value="telnet" disabled />
          Telnet (disabled by policy)
        </CheckboxLabel>
      </CheckboxGroup>
    </Fieldset>
  );
}
