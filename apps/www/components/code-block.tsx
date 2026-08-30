'use client';

import type { ComponentProps } from 'react';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';

import { parseInstallCommand, trackInstallCommandCopied } from '@/lib/analytics';

/**
 * The MDX `pre` — the code block fumadocs already ships, plus one listener.
 *
 * fumadocs' CopyButton owns the clipboard write and exposes no callback, so
 * rather than reimplement copying this watches the <figure> the button lives
 * in. A click that lands on a button inside a code block is a copy (it is the
 * only button in there), and the figure's own textContent is the code that was
 * taken. `onCopy` covers the other route — selecting the line and pressing
 * ⌘C, which never touches the button and fires no click.
 *
 * Both paths hand the text to parseInstallCommand, which reports nothing
 * unless it is one of ours.
 */
export function DocsCodeBlock({ children, ...props }: ComponentProps<'pre'>) {
  function report(text: string | null | undefined) {
    const command = parseInstallCommand(text);
    if (command) trackInstallCommandCopied(command);
  }

  return (
    <CodeBlock
      {...props}
      onClickCapture={(event) => {
        if (!(event.target as HTMLElement).closest('button')) return;
        report(event.currentTarget.textContent);
      }}
      onCopy={() => report(window.getSelection()?.toString())}
    >
      <Pre>{children}</Pre>
    </CodeBlock>
  );
}
