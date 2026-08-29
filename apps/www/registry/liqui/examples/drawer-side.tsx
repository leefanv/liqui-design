'use client';

import { Button } from '@/registry/liqui/ui/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '@/registry/liqui/ui/drawer';

/**
 * The same sheet against the right edge, dismissed by swiping right.
 *
 * `side` and `swipeDirection` are two props because they are two decisions —
 * a bottom sheet with snap points is often swiped down to a smaller size rather
 * than away — but for a plain panel they match, and mismatching them gives you a
 * sheet that leaves in a direction it never came from.
 *
 * `nativeButton={false}` on the trigger and closes: a liqui Button is not a
 * native <button>, and Base UI warns when it is handed one that says it is.
 */
export default function DrawerSide() {
  return (
    <Drawer swipeDirection="right">
      <DrawerTrigger nativeButton={false} render={<Button />}>Filters</DrawerTrigger>

      <DrawerContent side="right">
        <DrawerBody>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>
            A side panel is the same surface against a different edge. It travels
            on the same cached map, because a translate is all that changed.
          </DrawerDescription>

          <div className="mt-5 flex justify-end">
            <DrawerClose nativeButton={false} render={<Button variant="accent" />}>Done</DrawerClose>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
