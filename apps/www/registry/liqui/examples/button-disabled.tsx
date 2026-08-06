import { Button } from '@/registry/liqui/ui/button';

export default function ButtonDisabled() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Disabled</Button>
      <Button variant="accent" disabled>
        Disabled
      </Button>
    </div>
  );
}
