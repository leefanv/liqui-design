'use client';

import {
  NavigationMenu,
  NavigationMenuBarLink,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPopup,
  NavigationMenuTrigger,
} from '@/registry/liqui/ui/navigation-menu';

/**
 * Move between *Surface* and *Optics* without leaving the strip. The panel
 * glides across — which costs nothing, because the displacement map is keyed on
 * size and a moving box is still the same size — and then snaps to the new
 * item's dimensions rather than animating to them. Animating that would build a
 * fresh map on every frame of the resize.
 *
 * The content is what carries the change instead: it slides in from the side you
 * came from.
 */
const SURFACE = [
  ['Bezel', 'The refracting rim, measured inward from the edge.'],
  ['Tint', 'A gradient between two tokens, which is what makes state a retint.'],
  ['Specular', 'A generated image of the light along the profile.'],
  ['Shine', 'The cheap inset highlight the frost tier falls back to.'],
];

const OPTICS = [
  ['Displacement', 'How far the backdrop moves under each pixel of the bezel.'],
  ['Dispersion', 'Three passes at slightly different scales, for the colour split.'],
  ['Profile', 'The height function the rim is derived from.'],
];

export default function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Surface</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="m-0 grid list-none grid-cols-2 gap-0.5 p-0">
              {SURFACE.map(([title, body]) => (
                <li key={title}>
                  <NavigationMenuLink href="#" title={title}>
                    {body}
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Optics</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {OPTICS.map(([title, body]) => (
                <li key={title}>
                  <NavigationMenuLink href="#" title={title}>
                    {body}
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuBarLink href="#">Handbook</NavigationMenuBarLink>
        </NavigationMenuItem>
      </NavigationMenuList>

      <NavigationMenuPopup />
    </NavigationMenu>
  );
}
