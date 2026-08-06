'use client';

import * as React from 'react';

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/registry/liqui/ui/context-menu';

export default function ContextMenuDemo() {
  const [view, setView] = React.useState('icons');
  const [showHidden, setShowHidden] = React.useState(false);
  const [snap, setSnap] = React.useState(true);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div className="flex h-40 w-80 cursor-default items-center justify-center rounded-2xl border border-dashed border-white/40 text-[13px] text-white/80 select-none">
            Right-click anywhere here
          </div>
        }
      />
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuGroupLabel>View</ContextMenuGroupLabel>
          <ContextMenuRadioGroup value={view} onValueChange={setView}>
            <ContextMenuRadioItem value="icons">as Icons</ContextMenuRadioItem>
            <ContextMenuRadioItem value="list">as List</ContextMenuRadioItem>
            <ContextMenuRadioItem value="columns">as Columns</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>

        <ContextMenuSeparator />

        <ContextMenuCheckboxItem checked={showHidden} onCheckedChange={setShowHidden}>
          Show Hidden Files
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={snap} onCheckedChange={setSnap}>
          Snap to Grid
        </ContextMenuCheckboxItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>Sort By</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Name</ContextMenuItem>
            <ContextMenuItem>Date Modified</ContextMenuItem>
            <ContextMenuItem>Size</ContextMenuItem>
            <ContextMenuItem>Kind</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem>
          New Folder
          <ContextMenuShortcut>⇧⌘N</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>Paste</ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem variant="danger">
          Move to Trash
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
