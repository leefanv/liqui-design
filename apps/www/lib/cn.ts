/**
 * The Fumadocs template ships this re-exporting `cnfast`. Point it at liqui's
 * own `cn` instead so the docs chrome and the registry components merge classes
 * through exactly one implementation.
 */
export { cn } from '@/registry/liqui/lib/utils';
