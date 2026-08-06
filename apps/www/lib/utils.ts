/**
 * Registry components import `cn` from `@/lib/utils` because that is where the
 * shadcn CLI puts it in a consumer project. The docs site has to satisfy the
 * same specifier so the very same file compiles here and there — that identity
 * is the whole point of the registry being the single source of truth.
 *
 * (Fumadocs' own `lib/cn.ts` re-exports cnfast; this is the liqui-side one and
 * matches what ships in registry/liqui/lib/utils.ts.)
 */
export { cn } from '@/registry/liqui/lib/utils';
