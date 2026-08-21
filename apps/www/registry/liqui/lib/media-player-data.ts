import type { CSSProperties } from 'react';

/**
 * Sample library for the media player template.
 *
 * The palettes are the load-bearing part. Every track carries four colours and
 * an accent, and they drive both the cover art and the backdrop behind it — so
 * changing track changes what every glass surface on the page is refracting.
 * That is the whole demonstration: the surfaces do not animate, the thing
 * behind them does, and the lenses follow.
 *
 * No image files. A registry item travels as text — shadcn reads and writes
 * every file as UTF-8, and its schema has no encoding field — so a block that
 * referenced `/cover.jpg` would install a 404 into your project. Covers are
 * generated from these palettes in CSS instead, which also happens to be what
 * refraction wants: gradients with hard edges in them bend visibly, an even
 * blur barely reads at all.
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  /** Seconds. The player counts against this; nothing decodes audio. */
  duration: number;
  palette: Palette;
  /** Enough lines to fill the panel's third tab. Nothing is time-aligned. */
  lyrics: string[];
}

export interface Palette {
  /** Four stops, roughly light to dark, used for cover and backdrop alike. */
  stops: [string, string, string, string];
  /** Drives `--lq-accent` for the whole page while this track is current. */
  accent: string;
}

export const TRACKS: Track[] = [
  {
    id: 'refraction',
    title: 'Refraction',
    artist: 'Anna Vey',
    album: 'Index of Light',
    duration: 254,
    palette: {
      stops: ['#ffd166', '#ff5f6d', '#7b2ff7', '#0b1020'],
      accent: '#ff7a8a',
    },
    lyrics: [
      'Hold the edge against the light',
      'and watch the far wall bend',
      'Nothing here is moving',
      'except what is behind it',
      'Hold the edge against the light',
      'and count the way it lands',
    ],
  },
  {
    id: 'bezel',
    title: 'Bezel',
    artist: 'Anna Vey',
    album: 'Index of Light',
    duration: 197,
    palette: {
      stops: ['#8ef6e4', '#2f6bff', '#1b2a6b', '#05070f'],
      accent: '#5fd0ff',
    },
    lyrics: [
      'A narrow band of turning',
      'where the flat gives way',
      'Everything you see through it',
      'arrives a little late',
      'A narrow band of turning',
      'and then the flat again',
    ],
  },
  {
    id: 'dispersion',
    title: 'Dispersion',
    artist: 'Kes Morrow',
    album: 'Prism Hours',
    duration: 312,
    palette: {
      stops: ['#ff9a3c', '#ff2e63', '#3a0ca3', '#080611'],
      accent: '#ff8fa3',
    },
    lyrics: [
      'Split it into three',
      'and let them travel wide',
      'Red goes long, blue goes short',
      'green keeps to the line',
      'Split it into three',
      'and bring them back as white',
    ],
  },
  {
    id: 'specular',
    title: 'Specular',
    artist: 'Kes Morrow',
    album: 'Prism Hours',
    duration: 226,
    palette: {
      stops: ['#f7f3ff', '#c0a7ff', '#4c3a8f', '#0a0818'],
      accent: '#c4aaff',
    },
    lyrics: [
      'One light from the corner',
      'one to answer it',
      'The rim keeps both of them',
      'and gives them back at once',
      'One light from the corner',
      'and the shape it draws',
    ],
  },
  {
    id: 'brewster',
    title: 'Brewster Angle',
    artist: 'Kes Morrow',
    album: 'Prism Hours',
    duration: 268,
    palette: {
      stops: ['#ffd6e8', '#e05780', '#5a1846', '#0d060b'],
      accent: '#ff9ec4',
    },
    lyrics: [
      'Turn until it vanishes',
      'then hold that angle still',
      'Everything reflected',
      'has gone the other way',
      'Turn until it vanishes',
      'and nothing comes back up',
    ],
  },
  {
    id: 'total-internal',
    title: 'Total Internal',
    artist: 'Halden',
    album: 'Angle of Incidence',
    duration: 341,
    palette: {
      stops: ['#c8f9a0', '#00d2a8', '#0b5f6b', '#04120f'],
      accent: '#4fe3b8',
    },
    lyrics: [
      'Past a certain angle',
      'nothing gets away',
      'The whole of it comes back inside',
      'and travels down the glass',
      'Past a certain angle',
      'the light stays where it is',
    ],
  },
  {
    id: 'evanescent',
    title: 'Evanescent',
    artist: 'Halden',
    album: 'Angle of Incidence',
    duration: 233,
    palette: {
      stops: ['#d9f2ff', '#5fa8ff', '#123a7a', '#050a16'],
      accent: '#7fc4ff',
    },
    lyrics: [
      'It reaches past the surface',
      'by almost nothing at all',
      'A field that only exists',
      'where it has already stopped',
      'It reaches past the surface',
      'and falls off in the dark',
    ],
  },
  {
    id: 'caustics',
    title: 'Caustics',
    artist: 'Halden',
    album: 'Angle of Incidence',
    duration: 288,
    palette: {
      stops: ['#ffe9b0', '#ffa62b', '#8a3b12', '#140a06'],
      accent: '#ffb857',
    },
    lyrics: [
      'Curved light gathers',
      'and writes across the floor',
      'Bright where the surface folded',
      'dim where it lay flat',
      'Curved light gathers',
      'and moves when the water does',
    ],
  },
];

/** Albums in library order, each with its tracks — the shape the queue renders. */
export const ALBUMS = TRACKS.reduce<{ name: string; artist: string; tracks: Track[] }[]>(
  (albums, track) => {
    const last = albums[albums.length - 1];
    if (last?.name === track.album) last.tracks.push(track);
    else albums.push({ name: track.album, artist: track.artist, tracks: [track] });
    return albums;
  },
  [],
);

/** `3:07`. Used for durations and for elapsed time, which share a column. */
export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * The cover, as a CSS background stack.
 *
 * Composed for the lens rather than for the thumbnail. A conic sweep gives one
 * sharp seam where its first and last stops meet, and the two hard-edged bands
 * over it give three more at known angles — and a hard edge is the only thing
 * whose displacement you can actually see. Move a pixel of a smooth gradient
 * and it lands on a neighbour the same colour; move a pixel of an edge and the
 * edge visibly bends. Pretty and evenly blurred would refract into nothing.
 */
export function coverArt(palette: Palette): CSSProperties {
  const [a, b, c, d] = palette.stops;
  return {
    backgroundImage: [
      // A band with two hard boundaries, laid across the composition.
      `linear-gradient(115deg, transparent 0 38%, ${a} 38% 46%, transparent 46% 100%)`,
      // A second, thinner one, close enough to read as a pair.
      `linear-gradient(115deg, transparent 0 52%, ${b} 52% 55%, transparent 55% 100%)`,
      // The sweep. Its seam runs from the centre to the top edge.
      `conic-gradient(from 200deg at 62% 38%, ${b} 0deg, ${c} 120deg, ${d} 210deg, ${a} 300deg, ${b} 360deg)`,
    ].join(','),
  };
}
