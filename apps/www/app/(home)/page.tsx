import Link from 'next/link';

import { GlassStage } from '@/components/home/glass-stage';
import { gitConfig } from '@/lib/shared';

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Glass that actually refracts
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">
          Liquid glass components for React, built on{' '}
          <a href="https://base-ui.com" className="underline underline-offset-4">
            Base UI
          </a>
          . A canvas-generated displacement map driving an SVG filter — not a blur with a white
          overlay.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs"
            className="rounded-full bg-fd-primary px-5 py-2 text-sm font-medium text-fd-primary-foreground transition hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/docs/handbook/glass"
            className="rounded-full border border-fd-border px-5 py-2 text-sm font-medium transition hover:bg-fd-muted"
          >
            The material
          </Link>
          <a
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
            className="rounded-full border border-fd-border px-5 py-2 text-sm font-medium transition hover:bg-fd-muted"
          >
            GitHub
          </a>
        </div>

        <code className="mt-6 inline-block rounded-lg bg-fd-muted px-3 py-1.5 text-sm">
          npx shadcn@latest add https://liqui.design/r/button.json
        </code>
      </section>

      <GlassStage />

      <p className="mt-3 text-center text-sm text-fd-muted-foreground">
        Everything above is the component source{' '}
        <code className="rounded bg-fd-muted px-1 py-0.5 text-xs">shadcn add</code> installs. Drag
        the panel across a line and watch the line bend.
      </p>

      <section className="mt-14 grid gap-6 sm:grid-cols-3">
        <Feature title="You own the code">
          Components arrive as source in your project through the shadcn CLI. Only the refraction
          kernel — the maths and the browser workarounds — stays a dependency.
        </Feature>
        <Feature title="Built on Base UI">
          The same base shadcn/ui uses, so your existing <code>components.json</code>,{' '}
          <code>cn()</code> and Tailwind tokens carry over. Accessibility comes from the primitives,
          not from us.
        </Feature>
        <Feature title="Degrades honestly">
          Refraction is Chromium-only today. Safari and Firefox fall back to frosted blur
          automatically — no configuration, but do look at both.
        </Feature>
      </section>
    </main>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-1.5 font-semibold">{title}</h2>
      <p className="text-sm text-fd-muted-foreground [&_code]:rounded [&_code]:bg-fd-muted [&_code]:px-1 [&_code]:text-xs">
        {children}
      </p>
    </div>
  );
}
