import type { ReactNode } from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { LiquiGlass, type LiquiGlassProps } from '@liqui-design/glass';
import './alert-dialog.css';

/**
 * liqui AlertDialog — Base UI alert dialog on a LiquiGlass popup.
 *
 * The largest glass surface in the library, and the only one that refracts a
 * *dimmed* backdrop: the scrim sits behind the popup, so raising `frost` here
 * reads very differently than it does on a control sitting on bare wallpaper.
 */

export const Root = BaseAlertDialog.Root;
export const Trigger = BaseAlertDialog.Trigger;
export const Close = BaseAlertDialog.Close;

const POPUP_GLASS: LiquiGlassProps = {
  elevated: true,
  radius: 22,
  blur: 1,
  refraction: 130,
  bezel: 30,
};

export function Content({
  children,
  glass,
  ...popupProps
}: BaseAlertDialog.Popup.Props & { glass?: Partial<LiquiGlassProps> }) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop className="lq-dialog-backdrop" />
      <BaseAlertDialog.Popup
        {...popupProps}
        className="lq-dialog-popup"
        render={<LiquiGlass {...POPUP_GLASS} {...glass} />}
      >
        <div className="lq-dialog-body">{children}</div>
      </BaseAlertDialog.Popup>
    </BaseAlertDialog.Portal>
  );
}

export function Title(props: BaseAlertDialog.Title.Props) {
  return <BaseAlertDialog.Title {...props} className="lq-dialog-title" />;
}

export function Description(props: BaseAlertDialog.Description.Props) {
  return <BaseAlertDialog.Description {...props} className="lq-dialog-description" />;
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="lq-dialog-actions">{children}</div>;
}
