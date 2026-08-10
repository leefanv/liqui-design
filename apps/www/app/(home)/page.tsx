import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { GlassStage } from '@/components/home/glass-stage';
import { gallery, gitConfig } from '@/lib/shared';

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

      <section className="mt-14 border-t border-fd-border pt-10 sm:mt-20 sm:grid sm:grid-cols-[auto_1fr] sm:gap-10">
        <h2 className="mb-3 shrink-0 font-semibold sm:mb-0 sm:w-48">Where this came from</h2>
        <div className="max-w-2xl">
          <p className="text-fd-muted-foreground">
            liqui started as a collection.{' '}
            <strong className="font-medium text-fd-foreground">{gallery.name}</strong> gathers
            liquid glass and glassmorphism references — interfaces, artwork, motion — and every one
            of them is a picture. A picture is enough to study the material and not nearly enough to
            ship it: you can copy the tint and the blur out of a screenshot, but the part that makes
            it glass, the way an edge bends what is behind it, isn&apos;t in there to copy.
          </p>
          <p className="mt-3 text-fd-muted-foreground">
            So the gallery kept the references and this became the other half of it — the same
            material as components you install, in the browser, over your own background.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
            <ExternalLink href={gallery.url}>Browse the gallery</ExternalLink>
            <ExternalLink href={gallery.guide}>What liquid glass is</ExternalLink>
            <ExternalLink href={gallery.devResources}>Developer resources</ExternalLink>
          </div>
        </div>
      </section>
    </main>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-0.5 underline decoration-fd-border underline-offset-4 transition hover:decoration-current"
    >
      {children}
      <ArrowUpRight className="size-3.5 opacity-60" />
    </a>
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
