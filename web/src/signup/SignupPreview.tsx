import type { Profession } from '../api/types';
import { PROFESSION_LABELS, useWording } from '../lib/wording';
import { Activity } from '../ui/icons';
import { cx } from '../ui/utils';

/** Right-hand preview card: « Un aperçu de vos futures recommandations ». */
export function SignupPreview({ name, profession, showProducts }: { name: string; profession: Profession | null; showProducts: boolean }) {
  const w = useWording();
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const bar = (width: number, muted = false) => (
    <span className={cx('block h-px', muted ? 'bg-ink-muted opacity-60' : 'bg-ink')} style={{ width }} />
  );
  const placeholderProduct = (gradient: string) => (
    <div className="flex items-center gap-3 px-3 h-[46px] box-border bg-surface-card rounded-md shadow-[0_1px_3px_#0700351a]">
      <span className="flex-none w-7 h-7 rounded-[8px] flex items-center justify-center text-ink-muted" style={{ background: gradient }}>
        <span className="w-2 h-px bg-current block" />
      </span>
      <span className="block">
        <span className="block mb-2">{bar(9)}</span>
        {bar(8, true)}
      </span>
    </div>
  );
  const product = (gradient: string, color: string, abbr: string, title: string, sub: string) => (
    <div className="flex items-center gap-3 px-3 h-[46px] box-border bg-surface-card rounded-md shadow-[0_1px_3px_#0700351a]">
      <span className="flex-none w-7 h-7 rounded-[8px] flex items-center justify-center text-[9px] font-semibold" style={{ background: gradient, color }}>
        {abbr}
      </span>
      <span className="block min-w-0">
        <span className="block text-[10px] leading-[14px] font-semibold text-ink">{title}</span>
        <span className="block text-[8.5px] leading-3 text-ink-muted">{sub}</span>
      </span>
    </div>
  );

  return (
    <div className="hidden lg:flex flex-none w-[496px] h-[597px] box-border rounded-lg border border-brand-sage bg-linear-to-b from-surface-tint to-brand-sage flex-col items-center">
      <div className="mt-[50px] text-[15px] leading-[22px] font-medium text-ink-muted text-center">{w.signupPreviewTitle}</div>
      <div className="mt-[34px]">
        <div className="w-64 box-border p-4 bg-surface-card rounded-lg shadow-[0_4px_14px_#07003514]">
          <div className="flex items-center gap-3">
            <span className="flex-none w-[23px] h-[23px] rounded-[8px] bg-surface-subtle text-ink-muted flex items-center justify-center">
              <Activity size={12} strokeWidth={1.75} />
            </span>
            <span className="block">
              <span className="block text-sm leading-[18px] font-semibold text-ink-muted">{profession ? `Dr. ${name}` : name}</span>
              <span className="block text-[8.5px] leading-[11px] text-ink-muted">
                {profession ? PROFESSION_LABELS[profession] : 'Profession non renseignée'}
              </span>
            </span>
          </div>
          <div className="mt-4 text-[8.5px] leading-[11px] text-ink-muted">{w.signupPreviewFor}</div>
          <div className="text-[11px] leading-[15px] font-semibold text-ink">Jean Dupont</div>
          <div className="mt-4 text-[7.5px] leading-[10px] tracking-[.06em] text-ink-muted">{w.signupPreviewProducts}</div>
          <div className="mt-3 flex flex-col gap-1.5">
            {showProducts ? (
              <>
                {product('linear-gradient(135deg,#fde4c4,#f8d5b4)', '#7a4a12', 'Vit', 'Vitamin D3 + K2', '1 gélule / jour · Avec le petit-déjeuner')}
                {product('linear-gradient(135deg,#fbdada,#f3c3c5)', '#8a2f35', 'Mg', 'Magnésium Bisglycinate', '2 gélules / jour · 30 min avant le coucher')}
              </>
            ) : (
              <>
                {placeholderProduct('linear-gradient(135deg,#fde4c4,#f8d5b4)')}
                {placeholderProduct('linear-gradient(135deg,#fbdada,#f3c3c5)')}
              </>
            )}
          </div>
          <div className={cx('mt-4 p-3 box-border bg-[#ffffffb3] rounded-md', showProducts ? 'min-h-[60px]' : 'min-h-[86px]')}>
            <div className="text-[7.5px] leading-[10px] tracking-[.06em] text-ink-muted mb-1.5">NOTES</div>
            {showProducts ? (
              <span className="block text-[8.5px] leading-3 italic text-ink">
                Privilégiez une prise le matin pour la vitamine D (meilleure absorption avec un repas contenant des lipides) et le
                soir pour le magnésium (favorise relaxation musculaire et sommeil).
              </span>
            ) : (
              <span className="block w-2 h-px bg-ink-muted" />
            )}
          </div>
          <div className="mt-4 border-t border-border pt-3 text-[8px] leading-[11px] text-ink">Date : {today}</div>
        </div>
      </div>
    </div>
  );
}
