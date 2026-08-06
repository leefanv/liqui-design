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
          <AlertDialogClose render={<Button>Cancel</Button>} />
          <AlertDialogClose render={<Button variant="danger">Delete</Button>} />
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}
