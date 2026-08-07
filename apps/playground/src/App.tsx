import * as React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@registry/ui/accordion';
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@registry/ui/alert-dialog';
import { Button } from '@registry/ui/button';
import { Checkbox, CheckboxLabel } from '@registry/ui/checkbox';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@registry/ui/context-menu';
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@registry/ui/field';
import {
  LiquiGlass,
  type GlassMaterial,
  type GlassProfile,
} from '@liqui-design/glass';
import {
  DEFAULT_OPTICS,
  GlassControls,
  type GlassOptics,
} from '@shared/glass-controls';
import './demo/app.css';

// URL params override defaults so variants are screenshotable/linkable.
function initialSettings(): GlassOptics {
  const q = new URLSearchParams(location.search);
  const num = (key: keyof GlassOptics) =>
    q.has(key) ? Number(q.get(key)) : (DEFAULT_OPTICS[key] as number);
  return {
    material: (q.get('material') as GlassMaterial) || DEFAULT_OPTICS.material,
    profile: (q.get('profile') as GlassProfile) || DEFAULT_OPTICS.profile,
    refraction: num('refraction'),
    bezel: num('bezel'),
    dispersion: num('dispersion'),
    specular: num('specular'),
    frost: num('frost'),
    blur: num('blur'),
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
  const [glass, setGlass] = React.useState<GlassOptics>(initialSettings);

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
    <ContextMenu>
      <ContextMenuTrigger className="desktop" data-theme-root>
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
            <Accordion defaultValue={['lens']} className="stage__accordion">
              <AccordionItem value="lens" glass={glass}>
                <AccordionTrigger>How the lens is built</AccordionTrigger>
                <AccordionPanel>
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
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="resize" glass={glass}>
                <AccordionTrigger>Resizing surfaces</AccordionTrigger>
                <AccordionPanel>
                  <p>
                    Expanding a panel changes the glass box, so the displacement
                    map is regenerated at the new size — the bezel keeps hugging
                    the edge instead of stretching. Watch the rim while this item
                    opens and closes.
                  </p>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="tiers" glass={glass}>
                <AccordionTrigger>Material tiers</AccordionTrigger>
                <AccordionPanel>
                  <p>
                    <strong>Auto</strong> refracts where the browser supports SVG
                    backdrop filters and falls back to frost elsewhere.{' '}
                    <strong>Frost</strong> is blur + saturate only.{' '}
                    <strong>Clear</strong> drops the backdrop filter entirely and
                    leans on the tint.
                  </p>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </section>

          <section
            className="stage__col"
            onContextMenu={(e) => e.stopPropagation()}
          >
            <h2 className="stage__label">Field</h2>
            <form className="stage__form" onSubmit={(e) => e.preventDefault()}>
              {/* validationMode defaults to onSubmit; onBlur makes the invalid
                  ring reachable without a submit button. */}
              <Field name="name" validationMode="onBlur">
                <FieldLabel>Name</FieldLabel>
                <FieldControl glass={glass} required placeholder="Ada Lovelace" />
                <FieldError match="valueMissing">A name is required</FieldError>
              </Field>

              <Field name="email" validationMode="onBlur">
                <FieldLabel>Email</FieldLabel>
                <FieldControl
                  glass={glass}
                  type="email"
                  required
                  placeholder="ada@liqui.design"
                />
                <FieldDescription>
                  Tab out of the field to validate.
                </FieldDescription>
                <FieldError match="typeMismatch">
                  That doesn’t look like an email address
                </FieldError>
                <FieldError match="valueMissing">An email is required</FieldError>
              </Field>

              <Field
                name="passphrase"
                validationMode="onBlur"
                validate={(value) =>
                  String(value).length > 0 && String(value).length < 8
                    ? 'Use at least 8 characters'
                    : null
                }
              >
                <FieldLabel>Passphrase</FieldLabel>
                <FieldControl glass={glass} type="password" placeholder="••••••••" />
                <FieldError />
              </Field>

              <Field name="disabled" disabled>
                <FieldLabel>Disabled</FieldLabel>
                <FieldControl glass={glass} placeholder="Not editable" />
              </Field>
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
              <CheckboxLabel>
                <Checkbox
                  glass={glass}
                  checked={snapToGrid}
                  onCheckedChange={setSnapToGrid}
                />
                Snap to grid
              </CheckboxLabel>
              <CheckboxLabel>
                <Checkbox
                  glass={glass}
                  checked={showHidden}
                  onCheckedChange={setShowHidden}
                />
                Show hidden files
              </CheckboxLabel>
              <CheckboxLabel>
                <Checkbox glass={glass} indeterminate />
                Indeterminate
              </CheckboxLabel>
              <CheckboxLabel>
                <Checkbox glass={glass} defaultChecked disabled />
                Disabled
              </CheckboxLabel>
            </div>

            <h2 className="stage__label stage__label--spaced">Alert dialog</h2>
            <AlertDialog>
              {/* inline-flex buttons stretch as direct children of the column,
                  so the trigger sits in the same wrapper the button row uses. */}
              <div className="stage__buttons">
                <AlertDialogTrigger
                  nativeButton={false}
                  render={<Button variant="danger" glass={glass} />}
                >
                  Move to Trash…
                </AlertDialogTrigger>
              </div>
              <AlertDialogContent glass={glass}>
                <AlertDialogTitle>Move 3 items to Trash?</AlertDialogTitle>
                <AlertDialogDescription>
                  The dialog refracts the dimmed backdrop rather than the
                  wallpaper, so the same frost value reads darker here than on the
                  controls behind it.
                </AlertDialogDescription>
                <AlertDialogActions>
                  <AlertDialogClose
                    nativeButton={false}
                    render={<Button glass={glass} />}
                  >
                    Cancel
                  </AlertDialogClose>
                  <AlertDialogClose
                    nativeButton={false}
                    render={<Button variant="danger" glass={glass} />}
                    onClick={() => setLastAction('Moved 3 items to Trash')}
                  >
                    Move to Trash
                  </AlertDialogClose>
                </AlertDialogActions>
              </AlertDialogContent>
            </AlertDialog>
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

            <GlassControls value={glass} onChange={setGlass} />
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
      </ContextMenuTrigger>

      <ContextMenuContent glass={glass}>
        <ContextMenuItem
          onClick={() => setLastAction('New Folder')}
        >
          <span className="inline-flex w-4 justify-center opacity-85">📁</span>
          New Folder
          <ContextMenuShortcut>⇧⌘N</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setLastAction('Get Info')}>
          <span className="inline-flex w-4 justify-center opacity-85">ℹ️</span>
          Get Info
          <ContextMenuShortcut>⌘I</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>
          <span className="inline-flex w-4 justify-center opacity-85">📋</span>
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <span className="inline-flex w-4 justify-center opacity-85">👁️</span>
            View as
          </ContextMenuSubTrigger>
          <ContextMenuSubContent glass={glass}>
            <ContextMenuRadioGroup value={view} onValueChange={setView}>
              <ContextMenuRadioItem value="icons">Icons</ContextMenuRadioItem>
              <ContextMenuRadioItem value="list">List</ContextMenuRadioItem>
              <ContextMenuRadioItem value="columns">Columns</ContextMenuRadioItem>
              <ContextMenuRadioItem value="gallery">Gallery</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <span className="inline-flex w-4 justify-center opacity-85">↕️</span>
            Sort by
          </ContextMenuSubTrigger>
          <ContextMenuSubContent glass={glass}>
            <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
              <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
              <ContextMenuRadioItem value="kind">Kind</ContextMenuRadioItem>
              <ContextMenuRadioItem value="date">Date Modified</ContextMenuRadioItem>
              <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuGroup>
          <ContextMenuGroupLabel>Desktop</ContextMenuGroupLabel>
          <ContextMenuCheckboxItem
            checked={snapToGrid}
            onCheckedChange={setSnapToGrid}
          >
            Snap to Grid
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={showHidden} onCheckedChange={setShowHidden}>
            Show Hidden Files
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>

        <ContextMenuSeparator />

        <ContextMenuItem
          variant="danger"
          onClick={() => setLastAction('Move to Trash')}
        >
          <span className="inline-flex w-4 justify-center opacity-85">🗑️</span>
          Move to Trash
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
