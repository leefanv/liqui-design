'use client';

import { Button } from '@/registry/liqui/ui/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
} from '@/registry/liqui/ui/drawer';

/**
 * Open it, then drag it down without letting go. The sheet follows your finger
 * and the scrim fades with it, and no filter is rebuilt on the way — a translate
 * does not change the size or the optics the displacement map is keyed on, so
 * the whole gesture runs on one cached map.
 *
 * Which is the point: the swipe is the one moment where a rebuild would show up
 * as lag, and it is the one moment that cannot cause one.
 *
 * `nativeButton={false}` on the trigger and closes: a liqui Button is not a
 * native <button>, and Base UI warns when it is handed one that says it is.
 */
export default function DrawerDemo() {
  return (
    <Drawer swipeDirection="down">
      <DrawerTrigger nativeButton={false} render={<Button />}>Export project</DrawerTrigger>

      <DrawerContent side="bottom">
        <DrawerHandle />
        <DrawerBody>
          <DrawerTitle>Export project</DrawerTitle>
          <DrawerDescription>
            Everything in this workspace, as a single archive. Large projects can
            take a minute — you can close this and we will notify you.
          </DrawerDescription>

          <div className="mt-5 flex justify-end gap-2.5">
            <DrawerClose nativeButton={false} render={<Button />}>Not now</DrawerClose>
            <DrawerClose nativeButton={false} render={<Button variant="accent" />}>Export</DrawerClose>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
