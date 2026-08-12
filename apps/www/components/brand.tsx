import Image from 'next/image';

import logoMark from '@/app/logo.svg';
import { brandName } from '@/lib/shared';

/**
 * The logo and the full name, as one lockup. Fumadocs renders this as `nav.title`,
 * which puts it top-left of the home nav, at the head of the docs sidebar and in
 * the docs mobile header — the three places the site introduces itself.
 *
 * The mark is a lit sphere with its own colours, not a glyph tinted by the text
 * around it, so it carries no `currentColor` and looks the same in both themes.
 * `alt` is empty on purpose: the name is right there in the markup, and a mark
 * that announced itself would make every screen reader say the brand twice.
 */
export function Brand() {
  return (
    <>
      <Image src={logoMark} alt="" width={24} height={24} className="size-6" priority />
      {brandName}
    </>
  );
}
