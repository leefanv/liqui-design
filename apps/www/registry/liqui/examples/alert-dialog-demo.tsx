'use client';

import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/registry/liqui/ui/alert-dialog';
import { Button } from '@/registry/liqui/ui/button';

/**
 * `nativeButton={false}` follows the *material*. The Cancel button is glass —
 * four stacked layers, invalid inside a native <button> — so it opts out and
 * its close has to be told. Both `danger` buttons are solid, and solid means a
 * real <button> again, so they are composed without the escape hatch.
 */
export default function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="danger">Delete workspace</Button>} />
      <AlertDialogContent>
        <AlertDialogTitle>Delete this workspace?</AlertDialogTitle>
        <AlertDialogDescription>
          Every project, member and integration in it goes with it. This cannot be undone.
        </AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogClose nativeButton={false} render={<Button>Cancel</Button>} />
          <AlertDialogClose render={<Button variant="danger">Delete</Button>} />
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}
