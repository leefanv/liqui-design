'use client';

import { Button } from '@/registry/liqui/ui/button';
import {
  Menu,
  MenuContent,
  MenuEmpty,
  MenuFilterProvider,
  MenuGroupLabel,
  MenuInput,
  MenuItem,
  MenuList,
  MenuSection,
  MenuShortcut,
  MenuTrigger,
} from '@/registry/liqui/ui/menu';

const SECTIONS = [
  {
    label: 'File',
    items: [
      ['New Window', '⌘N'],
      ['Open…', '⌘O'],
      ['Duplicate', '⇧⌘S'],
      ['Rename…', ''],
    ],
  },
  {
    label: 'View',
    items: [
      ['Show Sidebar', '⌃⌘S'],
      ['Show Path Bar', '⌥⌘P'],
      ['Enter Full Screen', '⌃⌘F'],
    ],
  },
  {
    label: 'Window',
    items: [
      ['Minimise', '⌘M'],
      ['Zoom', ''],
      ['Bring All to Front', ''],
    ],
  },
] as const;

export default function MenuFilter() {
  return (
    <MenuFilterProvider>
      <Menu>
        <MenuTrigger nativeButton={false} render={<Button />}>
          Actions
        </MenuTrigger>
        <MenuContent>
          <MenuInput aria-label="Search actions" placeholder="Search" />
          <MenuEmpty>No matching actions.</MenuEmpty>
          <MenuList>
            {SECTIONS.map((section) => (
              <MenuSection key={section.label}>
                <MenuGroupLabel>{section.label}</MenuGroupLabel>
                {section.items.map(([label, shortcut]) => (
                  <MenuItem key={label}>
                    {label}
                    {shortcut ? <MenuShortcut>{shortcut}</MenuShortcut> : null}
                  </MenuItem>
                ))}
              </MenuSection>
            ))}
          </MenuList>
        </MenuContent>
      </Menu>
    </MenuFilterProvider>
  );
}
