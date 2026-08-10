'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/registry/liqui/ui/select';

// The trigger reads its label from here, not from the list — the popup is
// unmounted while closed, so there is no `ItemText` to look at.
const profiles = [
  { value: 'squircle', label: 'Squircle' },
  { value: 'convex', label: 'Convex' },
  { value: 'rim', label: 'Rim' },
  { value: 'flat', label: 'Flat' },
];

export default function SelectDemo() {
  return (
    <Select items={profiles} defaultValue="squircle">
      <SelectTrigger>
        <SelectValue placeholder="Choose a profile" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectGroupLabel>Physical</SelectGroupLabel>
          <SelectItem value="squircle">Squircle</SelectItem>
          <SelectItem value="convex">Convex</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectGroupLabel>Stylized</SelectGroupLabel>
          <SelectItem value="rim">Rim</SelectItem>
          <SelectItem value="flat" disabled>
            Flat (unavailable)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
