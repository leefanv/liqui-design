'use client';

import { Button } from '@/registry/liqui/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/liqui/ui/tooltip';

const ACTIONS = [
  { label: 'Undo', hint: 'Undo — ⌘Z', icon: 'M3.5 7h6.2a3.3 3.3 0 0 1 0 6.6H6M3.5 7l3-3M3.5 7l3 3' },
  { label: 'Redo', hint: 'Redo — ⇧⌘Z', icon: 'M14.5 7H8.3a3.3 3.3 0 0 0 0 6.6H12M14.5 7l-3-3M14.5 7l-3 3' },
  { label: 'Duplicate', hint: 'Duplicate — ⌘D', icon: 'M6.5 6.5v-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M4.5 6.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z' },
];

/**
 * One `TooltipProvider` around the group: moving between the buttons then skips
 * the delay for the second and third, which is what a toolbar should feel like.
 */
export default function TooltipDemo() {
  return (
    <TooltipProvider delay={300}>
      <div className="flex items-center gap-2">
        {ACTIONS.map((action) => (
          <Tooltip key={action.label}>
            {/* No `nativeButton={false}` here, unlike Dialog or Popover:
                Tooltip.Trigger doesn't run Base UI's button hook, so it takes
                the rendered element as-is and a liqui Button drops straight in. */}
            <TooltipTrigger
              render={
                <Button size="sm" aria-label={action.label}>
                  <svg viewBox="0 0 18 18" width="16" height="16" fill="none" aria-hidden>
                    <path
                      d={action.icon}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Button>
              }
            />
            <TooltipContent>{action.hint}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
