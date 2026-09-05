'use client';

import * as React from 'react';
import { Compass, Heart, House, Search, User } from 'lucide-react';

import { TabBar, TabBarItem } from '@/registry/liqui/ui/tab-bar';

const SECTIONS: Record<string, string[]> = {
  home: ['Today', 'Recently played', 'Made for you', 'New releases', 'Because you liked Bezel'],
  explore: ['Charts', 'Genres', 'Moods', 'Live sessions', 'Radio stations'],
  search: ['Artists', 'Albums', 'Playlists', 'Podcasts', 'Stations'],
  saved: ['Liked songs', 'Downloads', 'Recently added', 'Your playlists', 'Followed artists'],
  you: ['Listening report', 'Devices', 'Notifications', 'Privacy', 'About'],
};

/**
 * A tab bar has to float over something that moves, or it is a row of buttons.
 * The list behind it scrolls under the glass — that is the whole reason the bar
 * is the lens here and the pill inside it is not.
 */
export default function TabBarDemo() {
  const [tab, setTab] = React.useState('home');

  return (
    <div className="relative h-[440px] w-[376px] overflow-hidden rounded-[34px] border border-[var(--lq-rim-lo)] bg-[color-mix(in_srgb,var(--lq-text)_6%,transparent)]">
      <div className="h-full overflow-y-auto px-4 pt-5 pb-24">
        <h3 className="text-[19px] font-bold tracking-tight text-[var(--lq-text)] capitalize">
          {tab}
        </h3>
        <ul className="mt-3 flex flex-col gap-2">
          {[...SECTIONS[tab], ...SECTIONS[tab]].map((row, index) => (
            <li
              key={`${row}-${index}`}
              className="flex items-center gap-3 rounded-xl bg-[color-mix(in_srgb,var(--lq-text)_8%,transparent)] p-2.5"
            >
              <span className="size-9 shrink-0 rounded-lg bg-[var(--lq-accent)] opacity-80" />
              <span className="text-[13px] font-medium text-[var(--lq-text)]">{row}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <TabBar
          value={tab}
          onValueChange={(value) => setTab(value as string)}
          className="pointer-events-auto"
        >
          <TabBarItem value="home" icon={<House fill="currentColor" strokeWidth={0} />}>
            Home
          </TabBarItem>
          <TabBarItem value="explore" icon={<Compass fill="currentColor" strokeWidth={0} />}>
            Explore
          </TabBarItem>
          <TabBarItem value="search" icon={<Search strokeWidth={2.5} />}>
            Search
          </TabBarItem>
          <TabBarItem value="saved" icon={<Heart fill="currentColor" strokeWidth={0} />} badge={3}>
            Saved
          </TabBarItem>
          <TabBarItem value="you" icon={<User fill="currentColor" strokeWidth={0} />}>
            You
          </TabBarItem>
        </TabBar>
      </div>
    </div>
  );
}
