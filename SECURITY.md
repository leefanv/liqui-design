# Security policy

## Supported versions

liqui is pre-1.0. Only the latest release of `@liqui-design/glass` receives fixes.

## Reporting a vulnerability

Please **do not open a public issue.**

Use GitHub's private vulnerability reporting:
[Report a vulnerability](https://github.com/leefanv/liqui-design/security/advisories/new).
It goes to the maintainers only, and lets us prepare a fix before it becomes public.

Expect an acknowledgement within a few days. If you don't hear back in a week, feel free
to nudge via a public issue that says only that you're waiting on a security report —
no details.

## Scope

Worth reporting:

- Anything in `@liqui-design/glass` that can be made to execute attacker-controlled
  input. The kernel generates SVG filter definitions and canvas data URLs from props, so
  injection into a filter `id` or a `url()` is the shape of bug to look for.
- Supply-chain problems with the published package — unexpected files in the tarball,
  a dependency that shouldn't be there.

Probably not worth reporting:

- Anything requiring the developer to pass hostile values they control themselves. Props
  like `radius` and `refraction` are trusted input by design.
- The registry serving component source over HTTPS. That is what it is for.
