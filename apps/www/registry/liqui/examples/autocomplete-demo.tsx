'use client';

import {
  Autocomplete,
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteInputGroup,
  AutocompleteItem,
  AutocompleteList,
} from '@/registry/liqui/ui/autocomplete';

/**
 * A suggestion list, not a picker: the value is whatever you typed, and nothing
 * in the list is ever "the current one" — which is why the rows sit flush with
 * no check gutter reserved down the left.
 */
const TOKENS = [
  '--lq-accent',
  '--lq-danger',
  '--lq-highlight',
  '--lq-rim-hi',
  '--lq-rim-lo',
  '--lq-scrim',
  '--lq-text',
  '--lq-text-dim',
  '--lq-tint',
  '--lq-tint-deep',
];

export default function AutocompleteDemo() {
  return (
    <Autocomplete items={TOKENS}>
      <div className="w-72">
        <AutocompleteInputGroup>
          <AutocompleteInput placeholder="Search tokens" aria-label="Search tokens" />
          <AutocompleteClear />
        </AutocompleteInputGroup>
      </div>

      <AutocompleteContent>
        <AutocompleteEmpty>No token matches that.</AutocompleteEmpty>
        <AutocompleteList>
          {(token: string) => (
            <AutocompleteItem key={token} value={token}>
              <code className="font-mono text-[12.5px]">{token}</code>
            </AutocompleteItem>
          )}
        </AutocompleteList>
      </AutocompleteContent>
    </Autocomplete>
  );
}
