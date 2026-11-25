import type { ReactNode } from 'react';
import { useWording } from '../lib/wording';
import { Pencil } from './icons';
import { cx } from './utils';

/** Round initials (« JD »). */
export function Avatar({ text, size = 40, className }: { text: string; size?: number; className?: string }) {
  const font = size >= 40 ? 'text-sm leading-4' : 'text-11';
  return (
    <span
      className={cx('flex-none rounded-full bg-surface-tint text-brand-900 flex items-center justify-center font-medium', font, className)}
      style={{ width: size, height: size }}
    >
      {text}
    </span>
  );
}

/** « Client test » / « Patient test » badge next to the test patient's name. */
export function TestBadge() {
  const w = useWording();
  return (
    <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-success-tint text-brand-900 text-xs font-medium">
      <Pencil size={11} strokeWidth={1.75} />
      {w.N} test
    </span>
  );
}

/** Screen-reader only text, as in the reference (« Étape 1 sur 3 : », « (fait) »). */
export const SrOnly = ({ children }: { children: ReactNode }) => <span className="sr-only">{children}</span>;

