import type { ButtonHTMLAttributes } from 'react';
import { buttonClass, type ButtonPadding, type ButtonSize, type ButtonVariant } from './buttons';
import { cx } from './utils';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `none` for an icon-only button: give its width in className (e.g. `w-9`). */
  padding?: ButtonPadding;
};

/**
 * Button of the app. `className` is for layout only (margins, width, visibility),
 * never for colors or heights: those come from `variant` and `size` (see buttons.ts).
 * A disabled button takes the grey « disabled » look.
 */
export function Button({ variant = 'primary', size = 'md', padding, disabled, className, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cx(buttonClass(disabled ? 'disabled' : variant, size, padding), className)}
      {...rest}
    />
  );
}
