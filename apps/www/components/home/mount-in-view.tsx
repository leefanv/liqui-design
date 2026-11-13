'use client';

import * as React from 'react';

/**
 * Renders its children once they scroll into view, and keeps them after.
 *
 * Every example below the stage is live glass — a displacement map per
 * surface, built on mount — and none of it is on screen when the page opens.
 * Mounting it up front would spend that work, and the module-wide map budget,
 * on surfaces nobody has scrolled to yet.
 *
 * No root margin, on purpose. A tile that mounted *near* the viewport would
 * mount while the stage above it is still being looked at — and a surface
 * building its filter is exactly what the "dragging rebuilds no filter" check
 * would see as a regression.
 */
export function MountInView({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || shown) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShown(true);
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div ref={ref} className={className}>
      {shown ? children : null}
    </div>
  );
}
