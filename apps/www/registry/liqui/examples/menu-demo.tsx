'use client';

import * as React from 'react';

import { Button } from '@/registry/liqui/ui/button';
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from '@/registry/liqui/ui/menu';

export default function MenuDemo() {
  const [view, setView] = React.useState('icons');
  const [showHidden, setShowHidden] = React.useState(false);
  const [preview, setPreview] = React.useState(true);

  return (
    <Menu>
      {/* The trigger is a glass surface of its own, so it has to opt out of the
          native <button> the same way Button does — see the component page. */}
      <MenuTrigger nativeButton={false} render={<Button />}>
        View
      </MenuTrigger>
      <MenuContent>
        <MenuGroup>
          <MenuGroupLabel>Arrange</MenuGroupLabel>
          <MenuRadioGroup value={view} onValueChange={setView}>
            <MenuRadioItem value="icons">as Icons</MenuRadioItem>
            <MenuRadioItem value="list">as List</MenuRadioItem>
            <MenuRadioItem value="columns">as Columns</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>

        <MenuSeparator />

        <MenuCheckboxItem checked={showHidden} onCheckedChange={setShowHidden}>
          Show Hidden Files
        </MenuCheckboxItem>
        <MenuCheckboxItem checked={preview} onCheckedChange={setPreview}>
          Show Preview
        </MenuCheckboxItem>

        <MenuSeparator />

        <MenuSub>
          <MenuSubTrigger>Sort By</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Name</MenuItem>
            <MenuItem>Date Modified</MenuItem>
            <MenuItem>Size</MenuItem>
            <MenuItem>Kind</MenuItem>
          </MenuSubContent>
        </MenuSub>

        <MenuItem>
          Enter Full Screen
          <MenuShortcut>⌃⌘F</MenuShortcut>
        </MenuItem>
        <MenuItem disabled>Customise Toolbar…</MenuItem>

        <MenuSeparator />

        <MenuItem variant="danger">
          Reset to Defaults
          <MenuShortcut>⇧⌘R</MenuShortcut>
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
