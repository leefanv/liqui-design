import * as React from 'react';
import * as Accordion from './liqui/accordion/Accordion';
import * as AlertDialog from './liqui/alert-dialog/AlertDialog';
import * as Checkbox from './liqui/checkbox/Checkbox';
import * as Menu from './liqui/context-menu/ContextMenu';
import * as Field from './liqui/field/Field';
import { Button } from './liqui/button/Button';
import {
  LiquiGlass,
  type GlassMaterial,
  type GlassProfile,
} from '@liqui-design/glass';
import './demo/app.css';

interface GlassSettings {
  material: GlassMaterial;
  profile: GlassProfile;
  refraction: number;
  dispersion: number;
  specular: number;
  frost: number;
  blur: number;
}

// URL params override defaults so variants are screenshotable/linkable.
function initialSettings(): GlassSettings {
  const q = new URLSearchParams(location.search);
  return {
    material: (q.get('material') as GlassMaterial) || 'auto',
    profile: (q.get('profile') as GlassProfile) || 'squircle',
    refraction: Number(q.get('refraction') ?? 150),
    dispersion: Number(q.get('dispersion') ?? 0),
    specular: Number(q.get('specular') ?? 0.7),
    frost: Number(q.get('frost') ?? 0.35),
    blur: Number(q.get('blur') ?? 1),
  };
}

export default function App() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() =>
    location.search.includes('dark') ? 'dark' : 'light',
  );
  const [view, setView] = React.useState('icons');
  const [sort, setSort] = React.useState('name');
  const [showHidden, setShowHidden] = React.useState(false);
  const [snapToGrid, setSnapToGrid] = React.useState(true);
  const [lastAction, setLastAction] = React.useState<string | null>(null);
  const [glass, setGlass] = React.useState<GlassSettings>(initialSettings);

  const set = <K extends keyof GlassSettings>(key: K, value: GlassSettings[K]) =>
    setGlass((g) => ({ ...g, [key]: value }));

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
        <div className="os" aria-hidden>
          <img
            className="os__wallpaper"
            src="/os/wallpaper-light.jpg"
            alt=""
            draggable={false}
          />
          <img
            className="os__wallpaper os__wallpaper--dark"
            src="/os/wallpaper-dark.jpg"
            alt=""
            draggable={false}
          />
          <div className="os__menubar">
            <img src="/os/menu-bar-left.png" width={395} height={24} alt="" draggable={false} />
            <img src="/os/menu-bar-right.png" width={235} height={24} alt="" draggable={false} />
          </div>
          <div className="os__dock">
            <img
              className="os__dock-img"
              src="/os/dock-light.png"
              width={1153}
              height={56}
              alt=""
              draggable={false}
            />
            <img
              className="os__dock-img os__dock-img--dark"
              src="/os/dock-dark.png"
              width={1153}
              height={56}
              alt=""
              draggable={false}
            />
          </div>
        </div>

        <main className="stage">
          <section className="stage__col">
            <h2 className="stage__label">Accordion</h2>
            <Accordion.Root defaultValue={['lens']} className="stage__accordion">
              <Accordion.Item value="lens" glass={glass}>
                <Accordion.Trigger>How the lens is built</Accordion.Trigger>
                <Accordion.Panel>
                  <p>
                    A rounded-rect signed distance field gives depth and an outward
                    normal per pixel. A per-profile lookup table turns that depth
                    into a displacement magnitude, which is painted into a canvas
                    as an R/B vector map.
                  </p>
                  <p>
                    The map feeds <code>feDisplacementMap</code> through a
                    backdrop-filter, so the surface bends whatever sits behind it.
                  </p>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="resize" glass={glass}>
                <Accordion.Trigger>Resizing surfaces</Accordion.Trigger>
                <Accordion.Panel>
                  <p>
                    Expanding a panel changes the glass box, so the displacement
                    map is regenerated at the new size — the bezel keeps hugging
                    the edge instead of stretching. Watch the rim while this item
                    opens and closes.
                  </p>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="tiers" glass={glass}>
                <Accordion.Trigger>Material tiers</Accordion.Trigger>
                <Accordion.Panel>
                  <p>
                    <strong>Auto</strong> refracts where the browser supports SVG
                    backdrop filters and falls back to frost elsewhere.{' '}
                    <strong>Frost</strong> is blur + saturate only.{' '}
                    <strong>Clear</strong> drops the backdrop filter entirely and
                    leans on the tint.
                  </p>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          </section>

          <section
            className="stage__col"
            onContextMenu={(e) => e.stopPropagation()}
          >
            <h2 className="stage__label">Field</h2>
            <form className="stage__form" onSubmit={(e) => e.preventDefault()}>
              {/* validationMode defaults to onSubmit; onBlur makes the invalid
                  ring reachable without a submit button. */}
              <Field.Root name="name" validationMode="onBlur">
                <Field.Label>Name</Field.Label>
                <Field.Control glass={glass} required placeholder="Ada Lovelace" />
                <Field.Error match="valueMissing">A name is required</Field.Error>
              </Field.Root>

              <Field.Root name="email" validationMode="onBlur">
                <Field.Label>Email</Field.Label>
                <Field.Control
                  glass={glass}
                  type="email"
                  required
                  placeholder="ada@liqui.design"
                />
                <Field.Description>
                  Tab out of the field to validate.
                </Field.Description>
                <Field.Error match="typeMismatch">
                  That doesn’t look like an email address
                </Field.Error>
                <Field.Error match="valueMissing">An email is required</Field.Error>
              </Field.Root>

              <Field.Root
                name="passphrase"
                validationMode="onBlur"
                validate={(value) =>
                  String(value).length > 0 && String(value).length < 8
                    ? 'Use at least 8 characters'
                    : null
                }
              >
                <Field.Label>Passphrase</Field.Label>
                <Field.Control glass={glass} type="password" placeholder="••••••••" />
                <Field.Error />
              </Field.Root>

              <Field.Root name="disabled" disabled>
                <Field.Label>Disabled</Field.Label>
                <Field.Control glass={glass} placeholder="Not editable" />
              </Field.Root>
            </form>
          </section>

          <section className="stage__col">
            <h2 className="stage__label">Button</h2>
            <div className="stage__buttons">
              <Button glass={glass} onClick={() => setLastAction('Glass button')}>
                Glass
              </Button>
              <Button
                variant="accent"
                glass={glass}
                onClick={() => setLastAction('Accent button')}
              >
                Accent
              </Button>
              <Button
                variant="danger"
                glass={glass}
                onClick={() => setLastAction('Danger button')}
              >
                Danger
              </Button>
              <Button glass={glass} disabled>
                Disabled
              </Button>
            </div>

            <h2 className="stage__label stage__label--spaced">Checkbox</h2>
            <div className="stage__checks">
              <Checkbox.Label>
                <Checkbox.Root
                  glass={glass}
                  checked={snapToGrid}
                  onCheckedChange={setSnapToGrid}
                />
                Snap to grid
              </Checkbox.Label>
              <Checkbox.Label>
                <Checkbox.Root
                  glass={glass}
                  checked={showHidden}
                  onCheckedChange={setShowHidden}
                />
                Show hidden files
              </Checkbox.Label>
              <Checkbox.Label>
                <Checkbox.Root glass={glass} indeterminate />
                Indeterminate
              </Checkbox.Label>
              <Checkbox.Label>
                <Checkbox.Root glass={glass} defaultChecked disabled />
                Disabled
              </Checkbox.Label>
            </div>

            <h2 className="stage__label stage__label--spaced">Alert dialog</h2>
            <AlertDialog.Root>
              {/* inline-flex buttons stretch as direct children of the column,
                  so the trigger sits in the same wrapper the button row uses. */}
              <div className="stage__buttons">
                <AlertDialog.Trigger
                  render={<Button variant="danger" glass={glass} />}
                >
                  Move to Trash…
                </AlertDialog.Trigger>
              </div>
              <AlertDialog.Content glass={glass}>
                <AlertDialog.Title>Move 3 items to Trash?</AlertDialog.Title>
                <AlertDialog.Description>
                  The dialog refracts the dimmed backdrop rather than the
                  wallpaper, so the same frost value reads darker here than on the
                  controls behind it.
                </AlertDialog.Description>
                <AlertDialog.Actions>
                  <AlertDialog.Close render={<Button glass={glass} />}>
                    Cancel
                  </AlertDialog.Close>
                  <AlertDialog.Close
                    render={<Button variant="danger" glass={glass} />}
                    onClick={() => setLastAction('Moved 3 items to Trash')}
                  >
                    Move to Trash
                  </AlertDialog.Close>
                </AlertDialog.Actions>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </section>
        </main>

        <aside
          className="panel-wrap"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <LiquiGlass {...glass} radius={20} bezel={14} className="panel">
            <p className="panel__title">Glass settings</p>

            <label className="panel__row">
              <span>Material</span>
              <select
                value={glass.material}
                onChange={(e) => set('material', e.target.value as GlassMaterial)}
              >
                <option value="auto">Auto (refract → frost)</option>
                <option value="frost">Frost (cheap)</option>
                <option value="clear">Clear (cheapest)</option>
              </select>
            </label>

            <label className="panel__row">
              <span>Profile</span>
              <select
                value={glass.profile}
                onChange={(e) => set('profile', e.target.value as GlassProfile)}
              >
                <option value="squircle">Squircle (physical)</option>
                <option value="convex">Convex (physical)</option>
                <option value="rim">Rim (stylized)</option>
              </select>
            </label>

            <label className="panel__row">
              <span>
                Refraction <em>{glass.refraction}px</em>
              </span>
              <input
                type="range"
                min={0}
                max={200}
                value={glass.refraction}
                onChange={(e) => set('refraction', Number(e.target.value))}
              />
            </label>

            <label className="panel__row">
              <span>
                Dispersion <em>{glass.dispersion.toFixed(2)}</em>
              </span>
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.02}
                value={glass.dispersion}
                onChange={(e) => set('dispersion', Number(e.target.value))}
              />
            </label>

            <label className="panel__row">
              <span>
                Specular <em>{glass.specular.toFixed(2)}</em>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={glass.specular}
                onChange={(e) => set('specular', Number(e.target.value))}
              />
            </label>

            <label className="panel__row">
              <span>
                Frost <em>{glass.frost.toFixed(2)}</em>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={glass.frost}
                onChange={(e) => set('frost', Number(e.target.value))}
              />
            </label>

            <label className="panel__row">
              <span>
                Blur <em>{glass.blur}px</em>
              </span>
              <input
                type="range"
                min={0}
                max={10}
                value={glass.blur}
                onChange={(e) => set('blur', Number(e.target.value))}
              />
            </label>
          </LiquiGlass>
        </aside>

        <div className="dock-wrap">
          <LiquiGlass material={glass.material} radius={26} blur={1} refraction={90} bezel={16} className="dock">
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
            {lastAction ? (
              <span className="dock__note dock__note--action">→ {lastAction}</span>
            ) : (
              <span className="dock__note">
                Right-click the desktop ·{' '}
                <span className="dock__note-dim">
                  SVG refraction, frosted fallback on Safari/Firefox
                </span>
              </span>
            )}
          </LiquiGlass>
        </div>
      </Menu.Trigger>

      <Menu.Content glass={glass}>
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
          <Menu.SubmenuContent glass={glass}>
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
          <Menu.SubmenuContent glass={glass}>
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
