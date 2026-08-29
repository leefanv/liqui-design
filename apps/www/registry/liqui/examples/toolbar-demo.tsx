'use client';

import * as React from 'react';

import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/registry/liqui/ui/menu';
import { Toggle } from '@/registry/liqui/ui/toggle';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarSeparator,
} from '@/registry/liqui/ui/toolbar';

/**
 * One lens, eight controls. Every hover and every pressed state on this strip
 * is a wash over glass that is already there — press *B* and watch the accent
 * arrive without a second bezel arriving with it.
 *
 * The toggles were not told to go flat. `Toolbar` provides the same context
 * `ToggleGroup` does, so a `Toggle` behaves correctly by being in the right
 * place.
 */
export default function ToolbarDemo() {
  const [marks, setMarks] = React.useState<string[]>(['bold']);

  const mark = (value: string) => ({
    pressed: marks.includes(value),
    onPressedChange: (pressed: boolean) =>
      setMarks((current) =>
        pressed ? [...current, value] : current.filter((item) => item !== value),
      ),
  });

  return (
    <Toolbar aria-label="Formatting">
      <ToolbarGroup>
        <Toggle aria-label="Bold" {...mark('bold')}>
          <span className="font-bold">B</span>
        </Toggle>
        <Toggle aria-label="Italic" {...mark('italic')}>
          <span className="italic">I</span>
        </Toggle>
        <Toggle aria-label="Underline" {...mark('underline')}>
          <span className="underline underline-offset-2">U</span>
        </Toggle>
      </ToolbarGroup>

      <ToolbarSeparator orientation="vertical" />

      <Menu>
        <ToolbarButton render={<MenuTrigger />}>Paragraph</ToolbarButton>
        <MenuContent>
          <MenuItem>Heading 1</MenuItem>
          <MenuItem>Heading 2</MenuItem>
          <MenuItem>Paragraph</MenuItem>
          <MenuItem>Quote</MenuItem>
        </MenuContent>
      </Menu>

      <ToolbarSeparator orientation="vertical" />

      <ToolbarInput
        aria-label="Find in document"
        placeholder="Find…"
        className="w-28"
        defaultValue=""
      />
    </Toolbar>
  );
}
