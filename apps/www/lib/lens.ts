/**
 * Registry components import the lens kernel from `@/lib/lens` because that is
 * where the shadcn CLI puts it in a consumer project. The docs site has to
 * satisfy the same specifier so the very same file compiles here and there.
 */
export * from '@/registry/liqui/lib/lens';
