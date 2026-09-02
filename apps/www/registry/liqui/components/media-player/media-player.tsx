'use client';

import * as React from 'react';

import { LibraryPanel } from '@/registry/liqui/components/media-player/library-panel';
import { NowPlaying } from '@/registry/liqui/components/media-player/now-playing';
import { PlayerBackdrop } from '@/registry/liqui/components/media-player/player-backdrop';
import {
  TransportBar,
  type Bands,
  type RepeatMode,
} from '@/registry/liqui/components/media-player/transport-bar';
import { TooltipProvider } from '@/registry/liqui/ui/tooltip';
import { TRACKS, type Track } from '@/registry/liqui/lib/media-player-data';

/**
 * A full page of liqui, and an argument for the material rather than a gallery
 * of it.
 *
 * The argument is one interaction: change the track. Nothing on this page
 * animates in response — no surface moves, no colour is tweened on any of the
 * lenses. The only thing that changes is the artwork and the field behind it,
 * and every glass surface updates because it is genuinely looking at what is
 * behind it. A screenshot of glassmorphism cannot do that, which is the whole
 * reason this library exists.
 *
 * Two constraints shaped the layout, and both are worth keeping if you edit it:
 *
 * 1. Something has to not be glass. The cover art and the backdrop are the
 *    subjects; if everything refracts, nothing does.
 * 2. Lenses go on containers and on the parts that move — never on every child.
 *    The queue is one surface with rows drawn on it, the transport is one strip
 *    with the play button as its single moving lens. That keeps the page to
 *    roughly a dozen surfaces, which matters: displacement maps are cached per
 *    pixel size against a budget in the dozens.
 *
 * The root fills its container rather than measuring the viewport, so the same
 * component works as a full page and as a scaled card. It is `min-h-full`, not
 * `h-full`: on a narrow screen the three columns stack into something taller
 * than the viewport, and a fixed height would clip it with no way to reach the
 * rest. Give it a container with a real height and let that container scroll.
 *
 * State is local and the audio is imaginary — the clock below counts seconds so
 * the scrubber has something to do. Wire it to a real `<audio>` element by
 * replacing the interval with `timeupdate` and the setters with element calls;
 * nothing else in here needs to change.
 */
export default function MediaPlayer() {
  const [trackIndex, setTrackIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [shuffle, setShuffle] = React.useState(false);
  const [repeat, setRepeat] = React.useState<RepeatMode>('off');
  const [volume, setVolume] = React.useState(60);
  const [query, setQuery] = React.useState('');
  const [bands, setBands] = React.useState<Bands>({ low: 3, mid: 0, high: 2 });
  const [favourites, setFavourites] = React.useState<string[]>(['bezel']);
  const [output, setOutput] = React.useState('speakers');
  const [lossless, setLossless] = React.useState(true);
  const [crossfade, setCrossfade] = React.useState(false);

  const track = TRACKS[trackIndex];

  const goTo = React.useCallback((index: number) => {
    setTrackIndex(((index % TRACKS.length) + TRACKS.length) % TRACKS.length);
    setElapsed(0);
  }, []);

  const next = React.useCallback(() => {
    if (shuffle && TRACKS.length > 1) {
      // Never land on the track that just finished — with six tracks a repeat
      // reads as "shuffle is broken" far more often than it reads as chance.
      setTrackIndex((current) => {
        let pick = current;
        while (pick === current) pick = Math.floor(Math.random() * TRACKS.length);
        return pick;
      });
      setElapsed(0);
      return;
    }
    goTo(trackIndex + 1);
  }, [goTo, shuffle, trackIndex]);

  // Restart rather than go back when you are past the first few seconds, which
  // is what every player does and what the button is reached for most often.
  const previous = React.useCallback(() => {
    if (elapsed > 3) setElapsed(0);
    else goTo(trackIndex - 1);
  }, [elapsed, goTo, trackIndex]);

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((seconds) => {
        if (seconds < track.duration) return seconds + 1;
        if (repeat === 'one') return 0;
        // Deferred: this runs inside a state updater, and advancing the track
        // means setting other state. Queue it for after the commit instead.
        window.setTimeout(() => {
          if (repeat === 'off' && trackIndex === TRACKS.length - 1 && !shuffle) setPlaying(false);
          else next();
        }, 0);
        return seconds;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [next, playing, repeat, shuffle, track.duration, trackIndex]);

  // The accent goes on the document, not just on this subtree.
  //
  // Menus, popovers and select popups are portalled to `document.body` — that
  // is what keeps them clear of overflow and stacking contexts, and it also puts
  // them outside anything scoped to the player. Set the accent only here and
  // the page's controls follow the artwork while every floating surface stays
  // on the library's default blue, which looks like a bug because it is one.
  // A real app's accent is a property of the page, so this writes it there and
  // puts back whatever it found on the way out.
  React.useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.getPropertyValue('--lq-accent');
    root.style.setProperty('--lq-accent', track.palette.accent);
    return () => {
      if (previous) root.style.setProperty('--lq-accent', previous);
      else root.style.removeProperty('--lq-accent');
    };
  }, [track.palette.accent]);

  const selectTrack = React.useCallback(
    (selected: Track) => {
      goTo(TRACKS.findIndex((candidate) => candidate.id === selected.id));
      setPlaying(true);
    },
    [goTo],
  );

  return (
    <TooltipProvider>
      <div
        // `dark`, not `data-theme="dark"`. Both work in this repo, but the CLI
        // writes the dark token set under `.dark` in a consumer's stylesheet —
        // so a template shipped with `data-theme` would look right here and
        // render near-black text on a dark backdrop in your project.
        className="dark relative isolate flex min-h-full w-full items-center justify-center overflow-hidden p-4 text-[var(--lq-text)] sm:p-6"
        style={
          {
            // Also set here, so the first paint already has it — the effect
            // above runs after commit, and without this the controls flash the
            // default accent for a frame on every track change.
            '--lq-accent': track.palette.accent,
          } as React.CSSProperties
        }
      >
        <PlayerBackdrop palette={track.palette} />

        {/* Two columns and a rail under both.
            
            The artwork column is a square, so its height is its width and the
            panel beside it can simply be told to match — no measuring, and
            nothing that drifts when the type inside changes. The bar spans both
            columns, which is what stops the composition reading as a row of
            loose panels: it gives them a shared base and one horizontal line
            that runs the whole width.
            
            Stacked below `lg`, in reading order — artwork, then what is
            playing next, then the controls. */}
        <div className="grid w-full max-w-[880px] gap-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-5">
          <NowPlaying
            track={track}
            favourite={favourites.includes(track.id)}
            onFavouriteChange={(on) =>
              setFavourites((current) =>
                on ? [...current, track.id] : current.filter((id) => id !== track.id),
              )
            }
            volume={volume}
            onVolumeChange={setVolume}
            lossless={lossless}
            onLosslessChange={setLossless}
            className="mx-auto w-full max-w-[300px] sm:max-w-[380px] lg:mx-0"
          />

          <LibraryPanel
            track={track}
            onSelect={selectTrack}
            query={query}
            onQueryChange={setQuery}
            className="h-[300px] lg:h-[380px]"
          />

          <TransportBar
            track={track}
            elapsed={elapsed}
            onSeek={setElapsed}
            playing={playing}
            onPlayingChange={setPlaying}
            onPrevious={previous}
            onNext={next}
            shuffle={shuffle}
            onShuffleChange={setShuffle}
            repeat={repeat}
            onRepeatChange={setRepeat}
            sound={{
              bands,
              onBandChange: (id, value) => setBands((current) => ({ ...current, [id]: value })),
              output,
              onOutputChange: setOutput,
              crossfade,
              onCrossfadeChange: setCrossfade,
            }}
            className="lg:col-span-2"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
