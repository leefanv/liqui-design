import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import './accordion.css';

/**
 * liqui Accordion — Base UI accordion where every item is its own LiquiGlass
 * surface. Because the surface grows and shrinks with the panel, this is the
 * library's stress test for glass on an animating box: the displacement map
 * is regenerated as the item resizes.
 */

const ITEM_GLASS: LiquiGlassProps = {
  radius: 18,
  blur: 1,
  refraction: 110,
  bezel: 22,
};

export function Root({
  className,
  ...props
}: BaseAccordion.Root.Props & { className?: string }) {
  return (
    <BaseAccordion.Root
      {...props}
      className={['lq-accordion', className ?? ''].join(' ').trim()}
    />
  );
}

export function Item({
  glass,
  children,
  ...props
}: BaseAccordion.Item.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseAccordion.Item
      {...props}
      className="lq-accordion-item"
      render={<LiquiGlass {...ITEM_GLASS} {...glass} />}
    >
      {children}
    </BaseAccordion.Item>
  );
}

export function Trigger({ children, ...props }: BaseAccordion.Trigger.Props) {
  return (
    <BaseAccordion.Header className="lq-accordion-header">
      <BaseAccordion.Trigger {...props} className="lq-accordion-trigger">
        <span className="lq-accordion-label">{children}</span>
        <svg
          className="lq-accordion-chevron"
          viewBox="0 0 12 8"
          width="11"
          height="8"
          fill="none"
          aria-hidden
        >
          <path
            d="M1.5 1.75 6 6.25l4.5-4.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

export function Panel({ children, ...props }: BaseAccordion.Panel.Props) {
  return (
    <BaseAccordion.Panel {...props} className="lq-accordion-panel">
      <div className="lq-accordion-content">{children}</div>
    </BaseAccordion.Panel>
  );
}
