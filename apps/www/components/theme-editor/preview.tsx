'use client';

import * as React from 'react';

import type { ColorMode } from '@/lib/theme';
import { Wallpaper } from '@/components/wallpaper';
import { Button } from '@/registry/liqui/ui/button';
import { Checkbox, CheckboxLabel } from '@/registry/liqui/ui/checkbox';
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/registry/liqui/ui/dialog';
import { Field, FieldControl, FieldError, FieldLabel } from '@/registry/liqui/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/liqui/ui/popover';
import { Progress, ProgressLabel, ProgressTrack, ProgressValue } from '@/registry/liqui/ui/progress';
import {
  Slider,
  SliderControl,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from '@/registry/liqui/ui/slider';
import { Switch, SwitchLabel } from '@/registry/liqui/ui/switch';
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from '@/registry/liqui/ui/tabs';

/**
 * What the theme is being judged on.
 *
 * Chosen so that every knob in the panel has something on screen that answers
 * it: accent lands on the filled button, the checkbox and the switch; danger on
 * the destructive button and the field's error text; tint and rim on every
 * surface at once; shadow on the popover; scrim behind the dialog. A gallery
 * that showed eight buttons would leave half the panel unverifiable.
 *
 * The backdrop follows the mode being edited rather than the page's own theme —
 * you are editing the dark token set, so you should be looking at dark glass,
 * whichever way the docs around it are set.
 *
 * It is the same photograph the docs previews use, and that is the point: the
 * tokens are being tuned for the surface people will actually ship, not for a
 * gradient picked to flatter them. The ridge line supplies the hard edge the
 * generated backdrops had to draw hairlines for.
 */
export function ThemePreview({ mode }: { mode: ColorMode }) {
  const [notify, setNotify] = React.useState(true);
  const [sync, setSync] = React.useState(false);
  const [email, setEmail] = React.useState('not-an-address');
  const emailInvalid = !email.includes('@');

  return (
    <div
      data-theme={mode}
      // `min-h`, not `h`: a screen's worth of preview is the floor, so the
      // column is filled and the backdrop's hairlines land where the eye is.
      // Fixing the height instead would clip the components on a short window,
      // and clipping the thing being previewed is worse than a little scroll.
      className="not-prose relative isolate flex flex-col justify-center overflow-hidden rounded-2xl border border-fd-border lg:min-h-[calc(100dvh-6.5rem)]"
    >
      {/* Pinned to `mode`, not to the page. You are judging the dark token set
          against the night photograph even while the docs around you are in
          daylight — pairing it with the day one would be judging the material's
          worst case and calling it the material. */}
      <Wallpaper mode={mode} />

      <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Button>Cancel</Button>
            <Button variant="accent">Continue</Button>
            <Button variant="danger">Delete</Button>
          </div>

          {/* Validity is driven from here rather than from the browser's own
              constraint checking, so the error text — the one place
              `--lq-danger-text` is load-bearing — is on screen from the first
              frame instead of after a blur nobody will perform. */}
          <Field invalid={emailInvalid}>
            <FieldLabel>Email</FieldLabel>
            <FieldControl value={email} onChange={(event) => setEmail(event.target.value)} />
            <FieldError match={emailInvalid}>That is not an email address.</FieldError>
          </Field>

          <div className="flex flex-col gap-3">
            <CheckboxLabel>
              <Checkbox checked={notify} onCheckedChange={setNotify} />
              Notify me about releases
            </CheckboxLabel>
            <SwitchLabel>
              Sync across devices
              <Switch checked={sync} onCheckedChange={setSync} />
            </SwitchLabel>
          </div>

          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger nativeButton={false} render={<Button size="sm">Dialog</Button>} />
              <DialogContent>
                <DialogTitle>Scrim and elevation</DialogTitle>
                <DialogDescription>
                  The wash behind this panel is <code>--lq-scrim</code>; the depth under it is{' '}
                  <code>--lq-shadow</code>.
                </DialogDescription>
                <DialogActions>
                  <DialogClose nativeButton={false} render={<Button>Close</Button>} />
                </DialogActions>
              </DialogContent>
            </Dialog>

            <Popover>
              <PopoverTrigger nativeButton={false} render={<Button size="sm">Popover</Button>} />
              <PopoverContent>
                <PopoverTitle>Elevated glass</PopoverTitle>
                <PopoverDescription>
                  A floating surface refracts the page rather than a panel, so it is the honest test
                  of tint opacity.
                </PopoverDescription>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Slider defaultValue={62}>
            <div className="flex items-baseline justify-between">
              <SliderLabel>Refraction</SliderLabel>
              <SliderValue />
            </div>
            <SliderControl>
              <SliderTrack>
                <SliderThumb />
              </SliderTrack>
            </SliderControl>
          </Slider>

          <Progress value={68}>
            <div className="flex items-baseline justify-between">
              <ProgressLabel>Rendering</ProgressLabel>
              <ProgressValue />
            </div>
            <ProgressTrack />
          </Progress>

          <Tabs defaultValue="tint">
            <TabsList>
              <TabsTab value="tint">Tint</TabsTab>
              <TabsTab value="rim">Rim</TabsTab>
              <TabsTab value="text">Text</TabsTab>
              <TabsIndicator />
            </TabsList>
            <TabsPanel value="tint" className="min-h-24">
              The tint is a gradient between <code>--lq-tint</code> and{' '}
              <code>--lq-tint-deep</code>, scaled by frost. It is what carries legibility once
              refraction is gone.
            </TabsPanel>
            <TabsPanel value="rim" className="min-h-24">
              <code>--lq-rim-hi</code> and <code>--lq-rim-lo</code> draw the catch-light along the
              edge. Drop them to nothing and the surface stops having a boundary.
            </TabsPanel>
            <TabsPanel value="text" className="min-h-24">
              This paragraph is <code>--lq-text</code> and the labels around it are{' '}
              <code>--lq-text-dim</code>. If either is hard to read here, it will be worse over a
              photograph.
            </TabsPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
