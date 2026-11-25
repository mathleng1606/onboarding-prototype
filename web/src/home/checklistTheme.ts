import { useState } from 'react';
import type { ButtonVariant } from '../ui/buttons';

/**
 * LIGHT AND DARK VARIANTS OF THE « VOS PREMIERS PAS » CARD
 *
 * The dark variant is the default. The light one stays available to compare (menu ⋮ of the home page);
 * the choice is kept in this browser (localStorage).
 * The translucent whites of the dark variant (8, 12, 20, 50, 70 %) are not design-system tokens.
 */
export type ChecklistThemeName = 'light' | 'dark';

/** CSS classes of each part of the card, for each variant. */
export const CHECKLIST_THEMES = {
  light: {
    card: 'bg-surface-card border border-border',
    title: 'text-ink',
    count: 'text-ink',
    muted: 'text-ink-muted', // sub-texts, chevrons, close cross
    label: 'text-ink', // items to do
    done: 'text-ink-muted', // items done
    divider: 'border-border',
    highlight: 'bg-surface-tint', // next item
    track: 'bg-surface-tint', // progress bar background
    fill: 'bg-brand-800', // progress bar
    doneDot: 'bg-brand-800 text-white',
    ring: 'border-brand-link', // empty status dot
    cta: 'primary' as ButtonVariant, // « Commencer », « Choisir »
    pill: 'bg-surface-tint text-brand-900', // collapsed card
  },
  dark: {
    card: 'bg-linear-to-b from-brand-600 to-brand-900',
    title: 'text-white',
    count: 'text-white',
    muted: 'text-white/70',
    label: 'text-white',
    done: 'text-white/70',
    divider: 'border-white/12',
    highlight: 'bg-white/8',
    track: 'bg-white/20',
    fill: 'bg-brand-lime',
    doneDot: 'bg-brand-sage text-brand-900',
    ring: 'border-white/50',
    cta: 'tint' as ButtonVariant,
    pill: 'bg-brand-900 text-white',
  },
};
export type ChecklistTheme = (typeof CHECKLIST_THEMES)[ChecklistThemeName];

const STORAGE_KEY = 'checklist-theme';

/** Current variant and a function to change it (saved in this browser). */
export function useChecklistTheme() {
  const [name, setName] = useState<ChecklistThemeName>(() => (localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'));
  const choose = (next: ChecklistThemeName) => {
    localStorage.setItem(STORAGE_KEY, next);
    setName(next);
  };
  return { name, theme: CHECKLIST_THEMES[name], choose };
}
