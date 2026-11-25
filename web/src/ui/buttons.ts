/**
 * BUTTON STYLES
 *
 * One place for the look of every button of the app (colors and sizes of the reference app).
 * `buttonClass` returns the CSS classes; it is used by <Button> and by the few elements that look
 * like a button without being one (e.g. « Choisir ce patient » inside a clickable row).
 */
export type ButtonVariant = 'primary' | 'outline' | 'tint' | 'danger' | 'disabled';
/** Heights: xs 28 px, sm 32 px, md 36 px (default), lg 40 px. */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const BASE = 'inline-flex items-center justify-center gap-2 box-border rounded-sm text-sm font-medium whitespace-nowrap';

const VARIANTS: Record<ButtonVariant, string> = {
  /** Dark green gradient (`btn-primary` in index.css). */
  primary: 'btn-primary border-0',
  /** White with a dark green border. */
  outline: 'text-brand-900 bg-surface-card border border-brand-900',
  /** Light green, no border (« Ajouter un produit »). */
  tint: 'text-brand-900 bg-surface-tint border-0',
  /** Red border, for deleting. */
  danger: 'text-danger bg-transparent border border-danger',
  /** Grey, when the action is not available yet. */
  disabled: 'text-ink-muted bg-surface-disabled border-0',
};

const HEIGHTS: Record<ButtonSize, string> = { xs: 'h-7', sm: 'h-8', md: 'h-9', lg: 'h-10' };

/**
 * Side padding: `normal` 16 px, `compact` 12 px (« Créer une recommandation » of the home page),
 * `none` for icon-only buttons (the caller gives the width, e.g. `w-9` for a 36 px square).
 */
export type ButtonPadding = 'normal' | 'compact' | 'none';
const PADDINGS: Record<ButtonPadding, string> = { normal: 'px-4', compact: 'px-3', none: 'px-0' };

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', padding: ButtonPadding = 'normal') {
  return [BASE, VARIANTS[variant], HEIGHTS[size], PADDINGS[padding]].join(' ');
}
