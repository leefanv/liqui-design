import { Button } from '@/registry/liqui/ui/button';

/**
 * The `glass` prop reaches the surface underneath. `frost` is the material
 * density dial: 0 is Apple's "clear" tier (needs a busy backdrop to read), 1 is
 * "regular" (adaptive frosted, safe over anything).
 */
export default function ButtonGlassDial() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button glass={{ frost: 0 }}>frost 0</Button>
      <Button glass={{ frost: 0.35 }}>frost 0.35</Button>
      <Button glass={{ frost: 1 }}>frost 1</Button>
      <Button glass={{ refraction: 120, bezel: 16 }}>refraction 120</Button>
    </div>
  );
}
