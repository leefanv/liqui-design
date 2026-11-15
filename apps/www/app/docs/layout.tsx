import { source } from '@/lib/source';
import { DocsShell } from '@/components/docs-shell';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return <DocsShell tree={source.getPageTree()}>{children}</DocsShell>;
}
