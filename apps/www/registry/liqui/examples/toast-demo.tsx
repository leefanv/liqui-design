'use client';

import * as React from 'react';

import { Button } from '@/registry/liqui/ui/button';
import { Toaster, ToastProvider, useToast } from '@/registry/liqui/ui/toast';

export default function ToastDemo() {
  return (
    <ToastProvider>
      <ToastButtons />
      <Toaster />
    </ToastProvider>
  );
}

function ToastButtons() {
  const toast = useToast();
  const count = React.useRef(0);

  return (
    <div className="flex flex-wrap gap-2.5">
      <Button
        onClick={() => {
          count.current += 1;
          toast.add({
            title: `File ${count.current} exported`,
            description: 'Saved to Downloads.',
          });
        }}
      >
        Notify
      </Button>
      <Button
        variant="accent"
        onClick={() =>
          toast.add({
            title: 'Version restored',
            description: 'The document is back to how it was on Tuesday.',
            actionProps: { children: 'Undo', onClick: () => {} },
          })
        }
      >
        With an action
      </Button>
    </div>
  );
}
