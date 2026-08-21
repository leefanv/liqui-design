'use client';

import * as React from 'react';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/registry/liqui/ui/menubar';

export default function MenubarDemo() {
  const [sidebar, setSidebar] = React.useState(true);
  const [zoom, setZoom] = React.useState('100');

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New Window
            <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Open…
            <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Open Recent</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>wallpaper.jpg</MenubarItem>
              <MenubarItem>notes.md</MenubarItem>
              <MenubarItem>bezel-study.fig</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem variant="danger">
            Close Window
            <MenubarShortcut>⇧⌘W</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo
            <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            Redo
            <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Find…
            <MenubarShortcut>⌘F</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked={sidebar} onCheckedChange={setSidebar}>
            Show Sidebar
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
            <MenubarRadioItem value="80">80%</MenubarRadioItem>
            <MenubarRadioItem value="100">100%</MenubarRadioItem>
            <MenubarRadioItem value="150">150%</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
