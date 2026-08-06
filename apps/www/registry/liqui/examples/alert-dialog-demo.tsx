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
 * `nativeButton={false}` on the trigger and closes: a liqui Button is not a
 * native <button> — it cannot be, the glass anatomy is invalid inside one — and
 * Base UI warns unless the composing component is told so.
 */
export default function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        nativeButton={false}
        render={<Button variant="danger">Delete workspace</Button>}
      />
      <AlertDialogContent>
        <AlertDialogTitle>Delete this workspace?</AlertDialogTitle>
        <AlertDialogDescription>
          Every project, member and integration in it goes with it. This cannot be undone.
        </AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogClose nativeButton={false} render={<Button>Cancel</Button>} />
          <AlertDialogClose
            nativeButton={false}
            render={<Button variant="danger">Delete</Button>}
          />
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}
