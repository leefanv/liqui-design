'use client';

import * as React from 'react';

import { Button } from '@/registry/liqui/ui/button';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/liqui/ui/popover';
import { Switch, SwitchLabel } from '@/registry/liqui/ui/switch';

/**
 * The switches run on `material: 'clear'`. What sits behind a child of the popup
 * is the popup's own tint, not the page, so a lens there has nothing to bend but
 * the panel it is lying on. A switch cannot afford that: its state *is* its
 * tint, and sampling the panel desaturates the accent until on and off look
 * alike. Clear drops the backdrop filter and keeps the tint and rim, so the
 * accent arrives at full strength. See the component page for the general rule.
 */
export default function PopoverDemo() {
  const [mentions, setMentions] = React.useState(true);
  const [replies, setReplies] = React.useState(false);

  return (
    <Popover>
      <PopoverTrigger nativeButton={false} render={<Button>Notifications</Button>} />
      <PopoverContent>
        <PopoverTitle>Notifications</PopoverTitle>
        <PopoverDescription>What this workspace is allowed to interrupt you for.</PopoverDescription>
        <div className="mt-3.5 flex flex-col gap-3">
          <SwitchLabel>
            Mentions
            <Switch
              glass={{ material: 'clear' }}
              checked={mentions}
              onCheckedChange={setMentions}
            />
          </SwitchLabel>
          <SwitchLabel>
            Replies
            <Switch glass={{ material: 'clear' }} checked={replies} onCheckedChange={setReplies} />
          </SwitchLabel>
        </div>
        <div className="mt-4 flex justify-end">
          {/* The button keeps its glass: its label carries it, and its tint is
              dense enough to survive sampling the panel instead of the page. */}
          <PopoverClose nativeButton={false} render={<Button size="sm">Done</Button>} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
