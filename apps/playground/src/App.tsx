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
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogDismiss,
  DialogTitle,
  DialogTrigger,
} from '@registry/ui/dialog';
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@registry/ui/field';
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from '@registry/ui/menu';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@registry/ui/menubar';
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldLabel,
} from '@registry/ui/number-field';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@registry/ui/popover';
import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from '@registry/ui/progress';
import { Radio, RadioGroup, RadioLabel } from '@registry/ui/radio-group';
import { Toaster, useToast } from '@registry/ui/toast';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@registry/ui/select';
import {
  Slider,
  SliderControl,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from '@registry/ui/slider';
import { Switch, SwitchLabel } from '@registry/ui/switch';
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@registry/ui/tabs';
import { Toggle } from '@registry/ui/toggle';
import { ToggleGroup } from '@registry/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@registry/ui/tooltip';
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

/** Labels for the closed select — the popup is unmounted, so it can't supply them. */
const PROFILE_ITEMS = [
  { value: 'squircle', label: 'Squircle' },
  { value: 'convex', label: 'Convex' },
  { value: 'rim', label: 'Rim' },
];

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
  const [volume, setVolume] = React.useState(62);
  const [quality, setQuality] = React.useState('balanced');
  const [copied, setCopied] = React.useState(18);
  const [lastAction, setLastAction] = React.useState<string | null>(null);
  const [glass, setGlass] = React.useState<GlassOptics>(initialSettings);

  // Switch and Slider are not LiquiGlass surfaces — they carry their own lens
  // (see registry/liqui/lib/lens.tsx), so the geometric dials on the panel mean
  // nothing to them. Material still does: it is the one control that says
  // whether a surface refracts at all, so it drives their `lens` instead.
  const lensOn = glass.material === 'auto';

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // The progress bar climbs on its own. A growing fill is the case that would
  // thrash the map cache if it were a lens — it is a wash instead, so this runs
  // forever without regenerating anything. Watch the dials: they move the
  // track's bezel, and the fill never gets one.
  React.useEffect(() => {
    const timer = setInterval(() => setCopied((n) => (n >= 100 ? 0 : n + 2)), 220);
    return () => clearInterval(timer);
  }, []);

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

            <h2 className="stage__label stage__label--spaced">Switch</h2>
            {/* The switch puts the glass on the track and keeps the thumb
                opaque; the slider below does the opposite. Both are on screen
                together because the dials affect them in opposite places. */}
            <div className="stage__checks">
              <SwitchLabel>
                Snap to grid
                <Switch lens={lensOn} checked={snapToGrid} onCheckedChange={setSnapToGrid} />
              </SwitchLabel>
              <SwitchLabel>
                Show hidden files
                <Switch lens={lensOn} checked={showHidden} onCheckedChange={setShowHidden} />
              </SwitchLabel>
              <SwitchLabel>
                Unavailable
                <Switch lens={lensOn} disabled />
              </SwitchLabel>
            </div>

            <h2 className="stage__label stage__label--spaced">Slider</h2>
            <div className="stage__sliders">
              <Slider value={volume} onValueChange={(next) => setVolume(next as number)}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <SliderLabel>Volume</SliderLabel>
                  <SliderValue />
                </div>
                <SliderControl>
                  <SliderTrack>
                    <SliderThumb lens={lensOn} />
                  </SliderTrack>
                </SliderControl>
              </Slider>

              <Slider defaultValue={[24, 78]} minStepsBetweenValues={4}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <SliderLabel>Exposure range</SliderLabel>
                  <SliderValue>{(formatted) => `${formatted[0]} – ${formatted[1]}`}</SliderValue>
                </div>
                <SliderControl>
                  <SliderTrack>
                    <SliderThumb lens={lensOn} index={0} getAriaLabel={() => 'Minimum'} />
                    <SliderThumb lens={lensOn} index={1} getAriaLabel={() => 'Maximum'} />
                  </SliderTrack>
                </SliderControl>
              </Slider>
            </div>
            <h2 className="stage__label stage__label--spaced">Progress</h2>
            {/* Third answer to "which box refracts", and the first one that is
                about time rather than nesting: the track keeps the lens because
                a fill that grows would ask for a new displacement map on every
                frame and evict every other surface's on the way past. */}
            <div className="stage__progress">
              <Progress value={copied}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <ProgressLabel>Copying 248 items</ProgressLabel>
                  <ProgressValue />
                </div>
                <ProgressTrack glass={glass} />
              </Progress>

              <Progress value={null}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <ProgressLabel>Looking for devices</ProgressLabel>
                  <ProgressValue>{() => 'Searching…'}</ProgressValue>
                </div>
                <ProgressTrack glass={glass} />
              </Progress>
            </div>

            <h2 className="stage__label stage__label--spaced">Number field</h2>
            {/* One surface with three controls on it. Drag the label: the value
                scrubs, and nothing about the group's box changes, so the map
                the lens is drawn from is never regenerated. */}
            <div className="stage__form">
              <NumberField id="bezel" defaultValue={24} min={0} max={200} step={2}>
                <NumberFieldLabel htmlFor="bezel">Bezel width</NumberFieldLabel>
                <NumberFieldGroup glass={glass}>
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldGroup>
              </NumberField>
            </div>
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

            <h2 className="stage__label stage__label--spaced">Popover</h2>
            {/* The panel keeps the lens; its controls go clear. A child of a
                glass surface has that surface — not the wallpaper — behind it,
                so its own lens would only bend the panel it is lying on. Flip
                the switches to `glass` to watch that happen. */}
            <div className="stage__buttons">
              <Popover>
                <PopoverTrigger
                  nativeButton={false}
                  render={<Button glass={glass} />}
                >
                  Notifications
                </PopoverTrigger>
                <PopoverContent glass={glass}>
                  <PopoverTitle>Notifications</PopoverTitle>
                  <PopoverDescription>
                    The tail is outside the panel's box, so it refracts the
                    wallpaper along with everything else.
                  </PopoverDescription>
                  <div className="stage__checks" style={{ marginTop: 14 }}>
                    <SwitchLabel>
                      Mentions
                      <Switch lens={false} checked={showHidden} onCheckedChange={setShowHidden} />
                    </SwitchLabel>
                    <SwitchLabel>
                      Replies
                      <Switch lens={false} checked={snapToGrid} onCheckedChange={setSnapToGrid} />
                    </SwitchLabel>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <h2 className="stage__label stage__label--spaced">Dialog</h2>
            <Dialog>
              <div className="stage__buttons">
                <DialogTrigger
                  nativeButton={false}
                  render={<Button glass={glass} />}
                >
                  Share…
                </DialogTrigger>
              </div>
              <DialogContent glass={glass}>
                <DialogDismiss />
                <DialogTitle>Share this workspace</DialogTitle>
                <DialogDescription>
                  Dismissible, unlike the alert dialog. The × is a wash on the
                  glass already here rather than a surface of its own.
                </DialogDescription>
                <DialogActions>
                  <DialogClose nativeButton={false} render={<Button glass={glass} />}>
                    Cancel
                  </DialogClose>
                  <DialogClose
                    nativeButton={false}
                    render={<Button variant="accent" glass={glass} />}
                    onClick={() => setLastAction('Copied the share link')}
                  >
                    Copy link
                  </DialogClose>
                </DialogActions>
              </DialogContent>
            </Dialog>

            <h2 className="stage__label stage__label--spaced">Tabs</h2>
            {/* The pill is the only glass in the strip — the third component
                to answer "which of these two boxes refracts", and the second
                (after the slider) to answer it with "the one that moves". */}
            <div className="stage__tabs">
              <Tabs defaultValue="lens">
                <TabsList>
                  <TabsTab value="lens">Lens</TabsTab>
                  <TabsTab value="tint">Tint</TabsTab>
                  <TabsTab value="rim">Rim</TabsTab>
                  <TabsIndicator glass={glass} />
                </TabsList>
                <TabsPanel value="lens">
                  The pill keeps one size as it travels, so the whole slide
                  reuses a single cached displacement map.
                </TabsPanel>
                <TabsPanel value="tint">
                  Drive the dials on the right and the indicator is the surface
                  that changes — the groove under it never had a filter.
                </TabsPanel>
                <TabsPanel value="rim">
                  Turn the bezel up far enough and this is where it shows first:
                  a small box has little room to bend anything.
                </TabsPanel>
              </Tabs>
            </div>

            <h2 className="stage__label stage__label--spaced">Toggle</h2>
            {/* Standalone toggles are each their own lens; the group below is
                one lens with flat toggles on it. Same rule, opposite answers,
                because a `multiple` group has nothing that moves. */}
            <div className="stage__buttons">
              <Toggle glass={glass} defaultPressed>
                Focus
              </Toggle>
              <Toggle glass={glass}>Stage Manager</Toggle>
              <Toggle glass={glass} defaultPressed disabled>
                Managed
              </Toggle>
            </div>

            <h2 className="stage__label stage__label--spaced">Menubar</h2>
            {/* The third strip on this page, after the tabs and the toggle
                group, and the one that reaches Toggle Group's conclusion: no
                travelling element, so the bar refracts once and an open menu is
                a wash on it. */}
            <div className="stage__buttons" onContextMenu={(e) => e.stopPropagation()}>
              <Menubar glass={glass}>
                <MenubarMenu>
                  <MenubarTrigger>File</MenubarTrigger>
                  <MenubarContent glass={glass}>
                    <MenubarItem onClick={() => setLastAction('New Window')}>
                      New Window
                      <MenubarShortcut>⌘N</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSub>
                      <MenubarSubTrigger>Open Recent</MenubarSubTrigger>
                      <MenubarSubContent glass={glass}>
                        <MenubarItem>wallpaper.jpg</MenubarItem>
                        <MenubarItem>bezel-study.fig</MenubarItem>
                      </MenubarSubContent>
                    </MenubarSub>
                    <MenubarSeparator />
                    <MenubarItem variant="danger">Close Window</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>View</MenubarTrigger>
                  <MenubarContent glass={glass}>
                    <MenubarCheckboxItem checked={showHidden} onCheckedChange={setShowHidden}>
                      Show Hidden Files
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem checked={snapToGrid} onCheckedChange={setSnapToGrid}>
                      Snap to Grid
                    </MenubarCheckboxItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>

            <h2 className="stage__label stage__label--spaced">Toggle group</h2>
            <div className="stage__buttons">
              <ToggleGroup glass={glass} multiple defaultValue={['bold']} aria-label="Text style">
                <Toggle value="bold" aria-label="Bold" className="w-9 font-bold">
                  B
                </Toggle>
                <Toggle value="italic" aria-label="Italic" className="w-9 font-serif italic">
                  I
                </Toggle>
                <Toggle value="underline" aria-label="Underline" className="w-9 underline">
                  U
                </Toggle>
              </ToggleGroup>
            </div>
          </section>

          <section className="stage__col">
            <h2 className="stage__label">Button · Tooltip</h2>
            {/* One provider for the row: after the first tooltip opens, the
                neighbours skip the delay. Worth having over the wallpaper —
                a tooltip is the smallest surface here, and the first place an
                over-driven bezel shows. */}
            <TooltipProvider delay={300}>
              <div className="stage__buttons">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button glass={glass} onClick={() => setLastAction('Glass button')} />
                    }
                  >
                    Glass
                  </TooltipTrigger>
                  <TooltipContent glass={glass}>The default surface</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="accent"
                        glass={glass}
                        onClick={() => setLastAction('Accent button')}
                      />
                    }
                  >
                    Accent
                  </TooltipTrigger>
                  <TooltipContent glass={glass}>Retinted, not painted over</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="danger"
                        glass={glass}
                        onClick={() => setLastAction('Danger button')}
                      />
                    }
                  >
                    Danger
                  </TooltipTrigger>
                  <TooltipContent glass={glass}>Same trick, different token</TooltipContent>
                </Tooltip>
                <Button glass={glass} disabled>
                  Disabled
                </Button>
              </div>
            </TooltipProvider>

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

            <h2 className="stage__label stage__label--spaced">Radio group</h2>
            {/* A list, not a strip: the options do not share a box, so there is
                nothing to nest and each one is its own lens — the opposite
                conclusion from the toggle group two columns over. */}
            <div className="stage__checks">
              <RadioGroup
                value={quality}
                onValueChange={(value) => setQuality(value as string)}
                aria-label="Export quality"
              >
                <RadioLabel>
                  <Radio glass={glass} value="fast" />
                  Fast
                </RadioLabel>
                <RadioLabel>
                  <Radio glass={glass} value="balanced" />
                  Balanced
                </RadioLabel>
                <RadioLabel>
                  <Radio glass={glass} value="best" />
                  Best quality
                </RadioLabel>
                <RadioLabel>
                  <Radio glass={glass} value="lossless" disabled />
                  Lossless
                </RadioLabel>
              </RadioGroup>
            </div>

            <h2 className="stage__label stage__label--spaced">Select</h2>
            {/* Wired to the real dial: this select picks the lens profile it is
                itself rendered with, and stays in sync with the panel. */}
            <div onContextMenu={(e) => e.stopPropagation()}>
              <Select
                items={PROFILE_ITEMS}
                value={glass.profile}
                onValueChange={(value) =>
                  setGlass((current) => ({ ...current, profile: value as GlassProfile }))
                }
              >
                <SelectTrigger glass={glass}>
                  <SelectValue placeholder="Choose a profile" />
                </SelectTrigger>
                <SelectContent glass={glass}>
                  <SelectGroup>
                    <SelectGroupLabel>Physical</SelectGroupLabel>
                    <SelectItem value="squircle">Squircle</SelectItem>
                    <SelectItem value="convex">Convex</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectGroupLabel>Stylized</SelectGroupLabel>
                    <SelectItem value="rim">Rim</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <h2 className="stage__label stage__label--spaced">Menu</h2>
            {/* Two lenses that must not meet: the popup hangs off a glass
                button, and a `sideOffset` smaller than the trigger's bezel has
                the list refracting the button instead of the wallpaper. */}
            <div className="stage__buttons" onContextMenu={(e) => e.stopPropagation()}>
              <Menu>
                <MenuTrigger nativeButton={false} render={<Button glass={glass} />}>
                  View
                </MenuTrigger>
                <MenuContent glass={glass}>
                  <MenuGroup>
                    <MenuGroupLabel>Arrange</MenuGroupLabel>
                    <MenuRadioGroup value={view} onValueChange={setView}>
                      <MenuRadioItem value="icons">as Icons</MenuRadioItem>
                      <MenuRadioItem value="list">as List</MenuRadioItem>
                      <MenuRadioItem value="columns">as Columns</MenuRadioItem>
                    </MenuRadioGroup>
                  </MenuGroup>

                  <MenuSeparator />

                  <MenuCheckboxItem checked={showHidden} onCheckedChange={setShowHidden}>
                    Show Hidden Files
                  </MenuCheckboxItem>
                  <MenuCheckboxItem checked={snapToGrid} onCheckedChange={setSnapToGrid}>
                    Snap to Grid
                  </MenuCheckboxItem>

                  <MenuSeparator />

                  <MenuSub>
                    <MenuSubTrigger>Sort By</MenuSubTrigger>
                    <MenuSubContent glass={glass}>
                      <MenuItem onClick={() => setSort('name')}>Name</MenuItem>
                      <MenuItem onClick={() => setSort('date')}>Date Modified</MenuItem>
                      <MenuItem onClick={() => setSort('size')}>Size</MenuItem>
                    </MenuSubContent>
                  </MenuSub>

                  <MenuItem onClick={() => setLastAction('Entered full screen')}>
                    Enter Full Screen
                    <MenuShortcut>⌃⌘F</MenuShortcut>
                  </MenuItem>
                  <MenuItem disabled>Customise Toolbar…</MenuItem>
                </MenuContent>
              </Menu>
            </div>

            <h2 className="stage__label stage__label--spaced">Toast</h2>
            {/* A column, not a stack. Raise three and watch the gaps: an
                overlapping stack would put the front toast's backdrop on the
                card behind it, and the newest one would stop refracting. */}
            <div className="stage__buttons">
              <ToastButtons glass={glass} />
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

        {/* Portals to <body>; it sits here only because App has no wrapper. */}
        <Toaster glass={glass} />
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

/**
 * Raising a toast needs a component inside the provider, which is the one thing
 * about this component that is not a prop.
 */
function ToastButtons({ glass }: { glass: GlassOptics }) {
  const toast = useToast();
  const count = React.useRef(0);

  return (
    <>
      <Button
        glass={glass}
        onClick={() => {
          count.current += 1;
          toast.add({
            title: `File ${count.current} exported`,
            description: 'Saved to Downloads.',
          });
        }}
      >
        Notify
      </Button>
      <Button
        glass={glass}
        variant="accent"
        onClick={() =>
          toast.add({
            title: 'Version restored',
            description: 'Back to how it was on Tuesday.',
            actionProps: { children: 'Undo', onClick: () => {} },
          })
        }
      >
        With an action
      </Button>
    </>
  );
}
