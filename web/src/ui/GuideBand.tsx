import type { ReactNode } from 'react';
import { SrOnly } from './Badges';
import { cx } from './utils';

/**
 * GUIDE BAND (« mode démarrage », screens 1 to 3): 1-2-3 dots, a title, an optional sentence
 * and « Passer le guide ». Shown only while the guide is active (onboarding.guideActive).
 */

export function StepDots({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex-none flex items-center gap-1">
      {([1, 2, 3] as const).map((n) => (
        <span key={n} className="contents">
          {n > 1 && <span className="flex-none w-3 h-0.5 bg-brand-900 opacity-50" />}
          <span
            className={cx(
              'flex-none box-border w-5 h-5 rounded-full flex items-center justify-center text-11 font-medium',
              // Steps to come: #B9C8C8 (not a design-system token).
              n <= current ? 'bg-brand-900 text-white' : 'bg-[#B9C8C8] text-ink-muted',
            )}
          >
            {n < current ? (
              // Tight check of the reference (viewBox cropped to the tick).
              <svg width="12" height="9" viewBox="3 5 18 13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="block">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              n
            )}
          </span>
        </span>
      ))}
    </div>
  );
}

export function GuideBand({
  step,
  title,
  children,
  onSkip,
}: {
  step: 1 | 2 | 3;
  title: string;
  /** One sentence of sub-text in ink-muted (never bullets). */
  children?: ReactNode;
  onSkip: () => void;
}) {
  return (
    <section
      aria-label="Aide au démarrage"
      className="flex items-center gap-4 max-sm:flex-wrap max-sm:gap-y-3 py-3 px-4 bg-surface-tint border border-brand-sage rounded-md"
    >
      <StepDots current={step} />
      {/* Mobile: dots and « Passer le guide » on the first line, the text below (stacked band). */}
      <div className="flex-1 min-w-0 max-sm:order-last max-sm:basis-full">
        <div className="text-sm font-medium text-ink">
          <SrOnly>Étape {step} sur 3 : </SrOnly>
          <span>{title}</span>
        </div>
        {children && <div className="text-sm text-ink-muted">{children}</div>}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="flex-none max-sm:ml-auto text-xs text-ink-muted underline bg-transparent border-0 p-0"
      >
        Passer le guide
      </button>
    </section>
  );
}

