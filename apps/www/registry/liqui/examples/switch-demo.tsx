'use client';

import * as React from 'react';

import { Switch, SwitchLabel } from '@/registry/liqui/ui/switch';

export default function SwitchDemo() {
  const [wifi, setWifi] = React.useState(true);

  return (
    <div className="flex w-64 flex-col gap-4">
      <SwitchLabel>
        Wi-Fi
        <Switch checked={wifi} onCheckedChange={setWifi} />
      </SwitchLabel>
      <SwitchLabel>
        Bluetooth
        <Switch defaultChecked />
      </SwitchLabel>
      <SwitchLabel>
        Low Power Mode
        <Switch />
      </SwitchLabel>
      <SwitchLabel>
        Airplane Mode
        <Switch disabled />
      </SwitchLabel>
    </div>
  );
}
