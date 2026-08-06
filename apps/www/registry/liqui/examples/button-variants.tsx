import { Button } from '@/registry/liqui/ui/button';

export default function ButtonVariants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Glass</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="danger">Danger</Button>
    </div>
  );
}
