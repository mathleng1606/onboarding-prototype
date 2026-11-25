import type { ReactNode } from 'react';
import { Button } from '../ui';
import { ArrowRight, Plus, Star, Upload } from '../ui/icons';
import { useToast } from '../ui/toast';
import { cx, NOT_IN_PROTOTYPE } from '../ui/utils';

/* Pieces of the catalogue page (screen 9). */

/** Title of a catalogue section (20 px, 24 px above). */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center mt-6">
      <h2 className="m-0 flex-1 text-xl font-semibold text-ink">{children}</h2>
    </div>
  );
}

/** Product grid: 2 columns on small screens, 3 or 4 on large ones. */
export function Grid({ cols, children }: { cols: 3 | 4; children: ReactNode }) {
  return (
    <div className={cx('grid grid-cols-2 gap-4 max-sm:gap-3 mt-3', cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4')}>{children}</div>
  );
}

/** Icons size. */
const ICON = { size: 14, strokeWidth: 1.75 } as const;

/** « Catégories du moment »: two static cards copied from the reference. */
export function MomentCategories() {
  const toast = useToast();
  return (
    <>
      <SectionTitle>Catégories du moment</SectionTitle>
      <div className="flex flex-col md:flex-row gap-4 max-sm:gap-[13px] mt-3">
        {[
          ['/img/categorie-hiver.png', "Préparer l'hiver", 'Le terrain avant les symptômes'],
          ['/img/categorie-cycle.png', 'Cycle menstruel', 'Accompagner chaque phase du cycle'],
        ].map(([img, title, sub]) => (
          <button
            key={title}
            type="button"
            onClick={() => toast(NOT_IN_PROTOTYPE)}
            className="flex w-full md:w-[404px] h-36 max-sm:h-[133px] rounded-lg overflow-hidden bg-surface-neutral text-ink border-0 text-left p-0"
          >
            <img src={img} alt="" className="flex-none w-[161px] h-36 max-sm:w-[148px] max-sm:h-full object-cover block" />
            <div className="flex-1 pt-4 px-4">
              <div className="text-base font-semibold">{title}</div>
              <div className="mt-1 text-sm text-ink-muted">{sub}</div>
              <div className="mt-2 flex items-center gap-1 text-sm font-medium">
                Découvrir
                <ArrowRight {...ICON} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

/** « Configurons vos favoris » empty state; its button opens the favorites setup (screen 8). */
export function FavoritesEmpty({ onConfigure }: { onConfigure: () => void }) {
  return (
    <section className="mt-3 py-8 max-sm:py-12 max-sm:px-6 flex flex-col items-center text-center bg-surface-card border border-border rounded-lg">
      <span className="w-[60px] h-[60px] max-sm:w-14 max-sm:h-14 rounded-full bg-surface-subtle text-ink-muted flex items-center justify-center">
        <Star size={22} strokeWidth={1.5} />
      </span>
      <div className="mt-3 text-lg font-semibold text-ink">Configurons vos favoris</div>
      <div className="mt-2 text-base max-sm:text-sm text-ink-muted">
        Choisissez les catégories qui vous intéressent, puis sélectionnez les produits à enregistrer dans vos favoris.
      </div>
      {/* Mobile (app capture): star icon, smaller button, « Importer des produits » below it. */}
      <div className="flex flex-wrap justify-center items-center gap-6 max-sm:flex-col max-sm:gap-4 mt-4">
        {/* 34 px high as in the reference (the « ! » forces it over the standard heights). */}
        <Button onClick={onConfigure} className="h-[34px]! max-sm:h-7! max-sm:text-13 max-sm:px-2">
          <span className="flex max-sm:hidden">
            <Plus size={16} strokeWidth={1.75} />
          </span>
          <span className="hidden max-sm:flex">
            <Star size={16} strokeWidth={1.75} />
          </span>
          Configurer mes favoris
        </Button>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <Upload size={16} strokeWidth={1.75} />
          Importer des produits
        </span>
      </div>
    </section>
  );
}
