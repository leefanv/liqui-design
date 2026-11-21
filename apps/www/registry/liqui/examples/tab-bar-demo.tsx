'use client';

import * as React from 'react';
import {
  BatteryFull,
  ChevronRight,
  Compass,
  Disc3,
  Download,
  House,
  ListMusic,
  Mic2,
  Music2,
  Search,
  Signal,
  User,
  Wifi,
} from 'lucide-react';

import { TabBar, TabBarItem, TabBarSearch } from '@/registry/liqui/ui/tab-bar';

/**
 * A tab bar has to float over something that moves, or it is a row of buttons.
 * So this is a screen of a music app, and what scrolls under the glass is
 * cover art: the hero, the shelf of albums, the thumbnails down the queue.
 *
 * The covers are CSS, built for the lens rather than the thumbnail — a conic
 * sweep with hard-edged bands across it. An edge is the only thing whose
 * displacement you can see; a soft gradient or a grey row refracts into
 * nothing, and the bar over it reads as a tinted strip.
 *
 * Search is wired the way it is shaped: a trigger that opens and closes again.
 * The tab underneath never changes — come out of search and you are back where
 * you were, which is the difference between a mode and a destination.
 */

interface Track {
  title: string;
  artist: string;
  album: string;
  seconds: number;
  /** Light to dark. Drives the cover. */
  stops: [string, string, string, string];
}

const TRACKS: Track[] = [
  {
    title: 'Refraction',
    artist: 'Anna Vey',
    album: 'Index of Light',
    seconds: 254,
    stops: ['#ffd166', '#ff5f6d', '#7b2ff7', '#0b1020'],
  },
  {
    title: 'Bezel',
    artist: 'Anna Vey',
    album: 'Index of Light',
    seconds: 197,
    stops: ['#8ef6e4', '#2f6bff', '#1b2a6b', '#05070f'],
  },
  {
    title: 'Dispersion',
    artist: 'Kes Morrow',
    album: 'Prism Hours',
    seconds: 312,
    stops: ['#ff9a3c', '#ff2e63', '#3a0ca3', '#080611'],
  },
  {
    title: 'Specular',
    artist: 'Kes Morrow',
    album: 'Prism Hours',
    seconds: 226,
    stops: ['#f7f3ff', '#c0a7ff', '#4c3a8f', '#0a0818'],
  },
  {
    title: 'Brewster Angle',
    artist: 'Kes Morrow',
    album: 'Prism Hours',
    seconds: 268,
    stops: ['#ffd6e8', '#e05780', '#5a1846', '#0d060b'],
  },
  {
    title: 'Total Internal',
    artist: 'Halden',
    album: 'Angle of Incidence',
    seconds: 341,
    stops: ['#c8f9a0', '#00d2a8', '#0b5f6b', '#04120f'],
  },
  {
    title: 'Evanescent',
    artist: 'Halden',
    album: 'Angle of Incidence',
    seconds: 233,
    stops: ['#d9f2ff', '#5fa8ff', '#123a7a', '#050a16'],
  },
  {
    title: 'Caustics',
    artist: 'Halden',
    album: 'Angle of Incidence',
    seconds: 288,
    stops: ['#ffe9b0', '#ffa62b', '#8a3b12', '#140a06'],
  },
];

/** The cover for the i-th palette, wrapping. */
function cover(i: number): React.CSSProperties {
  const [a, b, c, d] = TRACKS[i % TRACKS.length].stops;
  return {
    backgroundImage: [
      `linear-gradient(115deg, transparent 0 38%, ${a} 38% 46%, transparent 46% 100%)`,
      `linear-gradient(115deg, transparent 0 52%, ${b} 52% 55%, transparent 55% 100%)`,
      `conic-gradient(from 200deg at 62% 38%, ${b} 0deg, ${c} 120deg, ${d} 210deg, ${a} 300deg, ${b} 360deg)`,
    ].join(','),
  };
}

const time = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function TabBarDemo() {
  const [tab, setTab] = React.useState('home');
  const [searching, setSearching] = React.useState(false);
  const [query, setQuery] = React.useState('');

  return (
    <div
      className={
        // An opaque screen, as an app's would be: the bar refracts the app,
        // not the wallpaper around the phone. Both theme keys, like the tokens.
        'relative h-[440px] w-[376px] overflow-hidden rounded-[34px] border border-[var(--hair)] bg-[var(--screen)] text-[var(--lq-text)] ' +
        '[--hair:rgba(60,60,67,0.16)] [--screen:#fff] ' +
        '[.dark_&]:[--hair:rgba(255,255,255,0.1)] [.dark_&]:[--screen:#0b0b0d] ' +
        '[[data-theme=dark]_&]:[--hair:rgba(255,255,255,0.1)] [[data-theme=dark]_&]:[--screen:#0b0b0d]'
      }
    >
      <div key={tab} className="h-full overflow-y-auto pt-11 pb-24">
        {tab === 'home' && <ListenNow />}
        {tab === 'browse' && <Browse />}
        {tab === 'library' && <Library />}
        {tab === 'you' && <You />}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-11 items-center justify-between px-8 text-[14px] font-semibold">
        <span className="tabular-nums">9:41</span>
        <span className="flex items-center gap-1.5">
          <Signal className="size-4" strokeWidth={2.5} />
          <Wifi className="size-4" strokeWidth={2.5} />
          <BatteryFull className="size-5" strokeWidth={2} />
        </span>
      </div>

      {/* Results, not a sheet: the field itself is in the bar. */}
      {searching && (
        <div className="absolute inset-0 overflow-y-auto bg-[var(--screen)] px-5 pt-14 pb-24">
          <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--lq-text-dim)] uppercase">
            {query ? 'Results' : 'Recent'}
          </p>
          <ul className="mt-2">
            {TRACKS.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())).map((t) => (
              <li
                key={t.title}
                className="flex items-center gap-3 border-b border-[var(--hair)] py-2.5 text-[15px]"
              >
                <Search className="size-4 text-[var(--lq-text-dim)]" />
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <TabBar
          value={tab}
          onValueChange={(value) => setTab(value as string)}
          className="pointer-events-auto"
        >
          <TabBarItem value="home" icon={<House strokeWidth={2.25} />}>
            Home
          </TabBarItem>
          <TabBarItem value="browse" icon={<Compass strokeWidth={2.25} />}>
            Browse
          </TabBarItem>
          <TabBarItem value="library" icon={<ListMusic strokeWidth={2.25} />} badge={3}>
            Library
          </TabBarItem>
          <TabBarItem value="you" icon={<User strokeWidth={2.25} />}>
            You
          </TabBarItem>
          <TabBarSearch
            icon={<Search strokeWidth={2.5} />}
            placeholder="Search music"
            query={query}
            onQueryChange={setQuery}
            open={searching}
            onOpenChange={(next) => {
              setSearching(next);
              if (!next) setQuery('');
            }}
          >
            Search
          </TabBarSearch>
        </TabBar>
      </div>
    </div>
  );
}

function Title({ children, avatar = true }: { children: React.ReactNode; avatar?: boolean }) {
  return (
    <div className="flex items-end justify-between px-5 pt-2 pb-3">
      <h3 className="text-[30px] leading-tight font-bold tracking-tight">{children}</h3>
      {avatar && <span className="mb-1 size-9 rounded-full" style={cover(3)} />}
    </div>
  );
}

function Section({ children, more = true }: { children: React.ReactNode; more?: boolean }) {
  return (
    <div className="mt-5 mb-2.5 flex items-center gap-1 px-5">
      <h4 className="text-[19px] font-bold tracking-tight">{children}</h4>
      {more && <ChevronRight className="size-5 text-[var(--lq-text-dim)]" strokeWidth={2.5} />}
    </div>
  );
}

function Album({ track, index }: { track: Track; index: number }) {
  return (
    <div>
      <div className="aspect-square rounded-xl" style={cover(index)} />
      <p className="mt-1.5 truncate text-[13px] font-medium">{track.album}</p>
      <p className="truncate text-[12px] text-[var(--lq-text-dim)]">{track.artist}</p>
    </div>
  );
}

function Queue({ offset = 0 }: { offset?: number }) {
  return (
    <ul className="px-5">
      {TRACKS.map((t, i) => (
        <li key={t.title} className="flex items-center gap-3">
          <span className="size-11 shrink-0 rounded-md" style={cover(i + offset)} />
          <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-[var(--hair)] py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px]">{t.title}</p>
              <p className="truncate text-[12.5px] text-[var(--lq-text-dim)]">{t.artist}</p>
            </div>
            <span className="text-[12.5px] text-[var(--lq-text-dim)] tabular-nums">
              {time(t.seconds)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ListenNow() {
  return (
    <>
      <Title>Listen Now</Title>
      <div className="px-5">
        <div className="relative h-[200px] overflow-hidden rounded-[18px]" style={cover(1)}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-x-4 bottom-3.5 text-white">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-white/75 uppercase">
              Made for you
            </p>
            <p className="text-[21px] leading-tight font-bold">Index of Light Mix</p>
            <p className="text-[12.5px] text-white/80">Anna Vey, Kes Morrow, Halden and more</p>
          </div>
        </div>
      </div>
      <Section>Recently Played</Section>
      <div className="flex gap-3 overflow-x-auto px-5 [scrollbar-width:none]">
        {TRACKS.slice(2).map((t, i) => (
          <div key={t.title} className="w-[132px] shrink-0">
            <Album track={t} index={i + 2} />
          </div>
        ))}
      </div>
      <Section>Up Next</Section>
      <Queue />
    </>
  );
}

const GENRES = [
  'Ambient',
  'Electronic',
  'Jazz',
  'Classical',
  'Indie',
  'Soundtracks',
  'Focus',
  'Late Night',
];

function Browse() {
  return (
    <>
      <Title>Browse</Title>
      <div className="grid grid-cols-2 gap-3 px-5">
        {GENRES.map((genre, i) => (
          <div
            key={genre}
            className="relative h-[104px] overflow-hidden rounded-2xl"
            style={cover(i + 4)}
          >
            <span className="absolute bottom-2.5 left-3 text-[15px] font-bold text-white">
              {genre}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

const SHELVES = [
  { icon: <ListMusic />, label: 'Playlists' },
  { icon: <Mic2 />, label: 'Artists' },
  { icon: <Disc3 />, label: 'Albums' },
  { icon: <Music2 />, label: 'Songs' },
  { icon: <Download />, label: 'Downloaded' },
];

function Library() {
  return (
    <>
      <Title>Library</Title>
      <ul className="px-5">
        {SHELVES.map((shelf) => (
          <li
            key={shelf.label}
            className="flex items-center gap-3 border-b border-[var(--hair)] py-3 text-[16px] [&_svg]:size-5"
          >
            <span className="text-[var(--lq-accent)]">{shelf.icon}</span>
            <span className="flex-1">{shelf.label}</span>
            <ChevronRight className="text-[var(--lq-text-dim)]" />
          </li>
        ))}
      </ul>
      <Section more={false}>Recently Added</Section>
      <div className="grid grid-cols-2 gap-3 px-5">
        {TRACKS.slice(0, 6).map((t, i) => (
          <Album key={t.title} track={t} index={i + 5} />
        ))}
      </div>
    </>
  );
}

function You() {
  return (
    <>
      <Title avatar={false}>You</Title>
      <div className="flex items-center gap-4 px-5">
        <span className="size-16 rounded-full" style={cover(3)} />
        <div>
          <p className="text-[18px] font-semibold">Mira Ekholm</p>
          <p className="text-[13px] text-[var(--lq-text-dim)]">14 h 32 m this week</p>
        </div>
      </div>
      <Section>Top Artists</Section>
      <div className="flex gap-4 px-5">
        {['Anna Vey', 'Kes Morrow', 'Halden'].map((artist, i) => (
          <div key={artist} className="text-center">
            <span className="block size-[88px] rounded-full" style={cover(i * 3)} />
            <p className="mt-1.5 text-[13px] font-medium">{artist}</p>
          </div>
        ))}
      </div>
      <Section>On Repeat</Section>
      <Queue offset={3} />
    </>
  );
}
