'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/registry/liqui/ui/avatar';

/**
 * Three states of the same component: a picture that loads, one that does not,
 * and one that was never given.
 *
 * The pictures are SVG data URIs rather than files, for the reason the media
 * player template gives at length — a registry item travels as UTF-8 text, so a
 * demo that pointed at `/portrait.jpg` would install a 404 into your project.
 * Swap them for real `src` strings; nothing else changes.
 */
function portrait(a: string, b: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient></defs>
    <rect width="96" height="96" fill="url(#g)"/>
    <circle cx="48" cy="38" r="16" fill="rgba(255,255,255,0.82)"/>
    <path d="M12 96a36 30 0 0 1 72 0z" fill="rgba(255,255,255,0.82)"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function AvatarDemo() {
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src={portrait('#7c5cff', '#2f6bff')} alt="Lena Toth" />
        <AvatarFallback delay={600}>LT</AvatarFallback>
      </Avatar>

      {/* The src is deliberately unreachable, so this one lands on its
          fallback — which is the whole disc as glass, initials on top. */}
      <Avatar>
        <AvatarImage src="/nothing-here.png" alt="Ravi Malhotra" />
        <AvatarFallback delay={600}>RM</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback>KO</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarImage src={portrait('#ff9f5c', '#e5484d')} alt="Sam Okonkwo" />
        <AvatarFallback delay={600}>SO</AvatarFallback>
      </Avatar>
    </div>
  );
}
