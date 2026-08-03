import * as React from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { LiquiGlass, type LiquiGlassProps } from '../glass/LiquiGlass';
import './context-menu.css';

/**
 * liqui ContextMenu — Base UI context menu wrapped in a LiquiGlass surface.
 * Re-exports the Base UI anatomy with liquid-glass styling applied, so
 * consumers compose it exactly like the headless original.
 */

export const Root = BaseContextMenu.Root;
export const Trigger = BaseContextMenu.Trigger;
export const Group = BaseContextMenu.Group;

const POPUP_GLASS: LiquiGlassProps = {
  elevated: true,
  radius: 18,
  blur: 3,
  refraction: 100,
  bezel: 18,
};

export function Content({
  children,
  glass,
  ...positionerProps
}: BaseContextMenu.Positioner.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner
        sideOffset={6}
        collisionPadding={12}
        {...positionerProps}
        className="lq-menu-positioner"
      >
        <BaseContextMenu.Popup
          className="lq-menu-popup"
          render={<LiquiGlass {...POPUP_GLASS} {...glass} />}
        >
          <div className="lq-menu-list">{children}</div>
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}

export function Item({
  className,
  ...props
}: BaseContextMenu.Item.Props & { className?: string }) {
  return (
    <BaseContextMenu.Item
      {...props}
      className={['lq-menu-item', className ?? ''].join(' ').trim()}
    />
  );
}

export function Separator() {
  return <BaseContextMenu.Separator className="lq-menu-separator" />;
}

export function GroupLabel(props: BaseContextMenu.GroupLabel.Props) {
  return <BaseContextMenu.GroupLabel {...props} className="lq-menu-group-label" />;
}

export function Shortcut({ children }: { children: React.ReactNode }) {
  return <span className="lq-menu-shortcut">{children}</span>;
}

const CheckIcon = (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
    <path
      d="M2 6.5 4.8 9.2 10 3.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function CheckboxItem({
  children,
  ...props
}: BaseContextMenu.CheckboxItem.Props) {
  return (
    <BaseContextMenu.CheckboxItem {...props} className="lq-menu-item lq-menu-item--check">
      <span className="lq-menu-indicator">
        <BaseContextMenu.CheckboxItemIndicator className="lq-menu-indicator-mark">
          {CheckIcon}
        </BaseContextMenu.CheckboxItemIndicator>
      </span>
      {children}
    </BaseContextMenu.CheckboxItem>
  );
}

export const RadioGroup = BaseContextMenu.RadioGroup;

export function RadioItem({ children, ...props }: BaseContextMenu.RadioItem.Props) {
  return (
    <BaseContextMenu.RadioItem {...props} className="lq-menu-item lq-menu-item--check">
      <span className="lq-menu-indicator">
        <BaseContextMenu.RadioItemIndicator className="lq-menu-indicator-mark">
          {CheckIcon}
        </BaseContextMenu.RadioItemIndicator>
      </span>
      {children}
    </BaseContextMenu.RadioItem>
  );
}

export const SubmenuRoot = BaseContextMenu.SubmenuRoot;

export function SubmenuTrigger({
  children,
  ...props
}: BaseContextMenu.SubmenuTrigger.Props) {
  return (
    <BaseContextMenu.SubmenuTrigger
      {...props}
      className="lq-menu-item lq-menu-item--submenu"
    >
      {children}
      <svg
        className="lq-menu-chevron"
        viewBox="0 0 8 12"
        width="7"
        height="11"
        fill="none"
        aria-hidden
      >
        <path
          d="M1.5 1.5 6 6l-4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </BaseContextMenu.SubmenuTrigger>
  );
}

export function SubmenuContent({
  children,
  glass,
  ...positionerProps
}: BaseContextMenu.Positioner.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner
        sideOffset={2}
        alignOffset={-6}
        collisionPadding={12}
        {...positionerProps}
        className="lq-menu-positioner"
      >
        <BaseContextMenu.Popup
          className="lq-menu-popup"
          render={
            <LiquiGlass {...POPUP_GLASS} refraction={64} bezel={13} {...glass} />
          }
        >
          <div className="lq-menu-list">{children}</div>
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}
