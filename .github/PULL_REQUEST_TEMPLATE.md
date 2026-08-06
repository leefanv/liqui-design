<!--
Thanks for the PR. Nothing here is bureaucracy — the checks below are the ones that
catch problems which otherwise surface in someone else's project.
-->

## What this changes

<!-- And why. If it fixes an issue, link it. -->

## Checklist

- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] Changed `packages/glass`? Added a changeset (`pnpm changeset`) and ran
      `pnpm --filter @liqui-design/glass test:package`
- [ ] Added or changed a component? Registered it in `registry.json`, added a demo, and
      wrote/updated its page under `content/docs/components/`
- [ ] Looked at it in **both** Chromium and Safari — the fallback path breaks quietly,
      because everything still renders, just flatter
- [ ] Screenshot or recording attached, if the change is visual

## Notes for the reviewer

<!-- Anything non-obvious: a trade-off you made, a thing you tried that didn't work. -->
