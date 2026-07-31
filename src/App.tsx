import * as React from 'react';
import * as Menu from './liqui/context-menu/ContextMenu';
import { LiquiGlass } from './liqui/glass/LiquiGlass';
import './demo/app.css';

const wallpaperTiles = ['🍇', '🌊', '🫧', '🍋', '🌸', '🪼', '🍑', '🌿', '🫐', '🍒', '🌀', '🦋'];

export default function App() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() =>
    location.search.includes('dark') ? 'dark' : 'light',
  );
  const [view, setView] = React.useState('icons');
  const [sort, setSort] = React.useState('name');
  const [showHidden, setShowHidden] = React.useState(false);
  const [snapToGrid, setSnapToGrid] = React.useState(true);
  const [lastAction, setLastAction] = React.useState<string | null>(null);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Dev hook: `?autopen` opens the menu automatically (used for screenshots).
  React.useEffect(() => {
    if (!location.search.includes('autopen')) return;
    const timer = setTimeout(() => {
      const target = document.querySelector('.desktop');
      target?.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          clientX: Math.round(innerWidth * 0.58),
          clientY: Math.round(innerHeight * 0.3),
        }),
      );
    }, 400);
    const timers = [timer];
    if (location.search.includes('submenu')) {
      const keys = ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowDown'];
      keys.forEach((key, i) => {
        timers.push(
          setTimeout(() => {
            document.activeElement?.dispatchEvent(
              new KeyboardEvent('keydown', { key, bubbles: true }),
            );
          }, 900 + i * 150),
        );
      });
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Menu.Root>
      <Menu.Trigger className="desktop" data-theme-root>
        <div className="wallpaper" aria-hidden>
          <div className="wallpaper__blob wallpaper__blob--1" />
          <div className="wallpaper__blob wallpaper__blob--2" />
          <div className="wallpaper__blob wallpaper__blob--3" />
          <div className="wallpaper__grid" />
        </div>

        <header className="hero">
          <p className="hero__brand">liqui</p>
          <h1 className="hero__title">Liquid Glass Context Menu</h1>
          <p className="hero__hint">
            Right-click (or long-press) anywhere on this desktop
          </p>
          {lastAction && <p className="hero__action">→ {lastAction}</p>}
        </header>

        <div className={`tiles tiles--${view}`} aria-hidden>
          {wallpaperTiles.map((emoji, i) => (
            <div className="tile" key={i} style={{ animationDelay: `${i * 0.35}s` }}>
              {emoji}
            </div>
          ))}
        </div>

        <div className="dock-wrap">
          <LiquiGlass radius={26} blur={2.5} refraction={48} bezel={10} className="dock">
            <button
              type="button"
              className="dock__button"
              onClick={(e) => {
                e.stopPropagation();
                setTheme(theme === 'light' ? 'dark' : 'light');
              }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
            <span className="dock__divider" />
            <span className="dock__note">
              Base UI · SVG refraction{' '}
              <span className="dock__note-dim">(frosted fallback on Safari/Firefox)</span>
            </span>
          </LiquiGlass>
        </div>
      </Menu.Trigger>

      <Menu.Content>
        <Menu.Item
          onClick={() => setLastAction('New Folder')}
        >
          <span className="lq-menu-icon">📁</span>
          New Folder
          <Menu.Shortcut>⇧⌘N</Menu.Shortcut>
        </Menu.Item>
        <Menu.Item onClick={() => setLastAction('Get Info')}>
          <span className="lq-menu-icon">ℹ️</span>
          Get Info
          <Menu.Shortcut>⌘I</Menu.Shortcut>
        </Menu.Item>
        <Menu.Item disabled>
          <span className="lq-menu-icon">📋</span>
          Paste
          <Menu.Shortcut>⌘V</Menu.Shortcut>
        </Menu.Item>

        <Menu.Separator />

        <Menu.SubmenuRoot>
          <Menu.SubmenuTrigger>
            <span className="lq-menu-icon">👁️</span>
            View as
          </Menu.SubmenuTrigger>
          <Menu.SubmenuContent>
            <Menu.RadioGroup value={view} onValueChange={setView}>
              <Menu.RadioItem value="icons">Icons</Menu.RadioItem>
              <Menu.RadioItem value="list">List</Menu.RadioItem>
              <Menu.RadioItem value="columns">Columns</Menu.RadioItem>
              <Menu.RadioItem value="gallery">Gallery</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.SubmenuContent>
        </Menu.SubmenuRoot>

        <Menu.SubmenuRoot>
          <Menu.SubmenuTrigger>
            <span className="lq-menu-icon">↕️</span>
            Sort by
          </Menu.SubmenuTrigger>
          <Menu.SubmenuContent>
            <Menu.RadioGroup value={sort} onValueChange={setSort}>
              <Menu.RadioItem value="name">Name</Menu.RadioItem>
              <Menu.RadioItem value="kind">Kind</Menu.RadioItem>
              <Menu.RadioItem value="date">Date Modified</Menu.RadioItem>
              <Menu.RadioItem value="size">Size</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.SubmenuContent>
        </Menu.SubmenuRoot>

        <Menu.Separator />

        <Menu.Group>
          <Menu.GroupLabel>Desktop</Menu.GroupLabel>
          <Menu.CheckboxItem
            checked={snapToGrid}
            onCheckedChange={setSnapToGrid}
          >
            Snap to Grid
          </Menu.CheckboxItem>
          <Menu.CheckboxItem checked={showHidden} onCheckedChange={setShowHidden}>
            Show Hidden Files
          </Menu.CheckboxItem>
        </Menu.Group>

        <Menu.Separator />

        <Menu.Item
          className="lq-menu-item--danger"
          onClick={() => setLastAction('Move to Trash')}
        >
          <span className="lq-menu-icon">🗑️</span>
          Move to Trash
          <Menu.Shortcut>⌘⌫</Menu.Shortcut>
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}
