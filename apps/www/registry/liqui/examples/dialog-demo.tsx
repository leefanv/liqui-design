'use client';

import { Button } from '@/registry/liqui/ui/button';
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogDismiss,
  DialogTitle,
  DialogTrigger,
} from '@/registry/liqui/ui/dialog';

/**
 * `nativeButton={false}` follows the *material*, not the component. A glass
 * Button is four stacked layers, which is invalid inside a native <button>, so
 * it opts out and the composing trigger has to be told. A solid one — `accent`
 * here — is a real <button> again, so the close that renders it says nothing.
 */
export default function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger nativeButton={false} render={<Button>Share workspace</Button>} />
      <DialogContent>
        <DialogDismiss />
        <DialogTitle>Share this workspace</DialogTitle>
        <DialogDescription>
          Anyone with the link can open the workspace and read every project in it. Only members
          can edit.
        </DialogDescription>
        <div className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--lq-highlight)_30%,transparent)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--lq-text-dim)] shadow-[inset_0_0.5px_0_color-mix(in_srgb,var(--lq-rim-hi)_55%,transparent)]">
          liqui.design/s/9f3c-aurora
        </div>
        <DialogActions>
          <DialogClose nativeButton={false} render={<Button>Cancel</Button>} />
          <DialogClose render={<Button variant="accent">Copy link</Button>} />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
