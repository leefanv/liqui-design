import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import type { MDXComponents } from 'mdx/types';

import { ComponentPreview } from '@/components/component-preview';
import { DocsCodeBlock } from '@/components/code-block';
import { ComponentDirectory } from '@/components/component-directory';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    // fumadocs' own code block with a copy listener on it, so that taking an
    // install command away is a measurable event. See components/code-block.tsx.
    pre: DocsCodeBlock,
    // Available in every page without an import — a component doc that has to
    // import its own preview harness on line 1 invites drift.
    ComponentPreview,
    ComponentDirectory,
    Tabs,
    Tab,
    TypeTable,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
