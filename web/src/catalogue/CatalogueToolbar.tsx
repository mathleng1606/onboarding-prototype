import { ChevronDown, Search, Sparkles, TrendingUp } from '../ui/icons';
import { useToast } from '../ui/toast';
import { NOT_IN_PROTOTYPE } from '../ui/utils';

/** Filter icons size. */
const ICON = { size: 14, strokeWidth: 1.75 } as const;

/**
 * Tabs, search bar and filters of the catalogue. Only the search works (by name or brand, in the browser);
 * tabs, « Recherche IA » and filters are copied from the reference and do nothing.
 */
export function CatalogueToolbar({ q, onSearch }: { q: string; onSearch: (q: string) => void }) {
  const toast = useToast();
  return (
    <>
    <div className="flex gap-2 border-b border-border mt-3">
      <span className="py-3 px-4 -mb-px border-b-[3px] border-brand-900 text-sm font-semibold text-brand-900">Catalogue Simplycure</span>
      <span className="py-3 px-4 text-sm font-medium text-ink-muted">Mes produits (0)</span>
    </div>

    <label className="flex items-center gap-3 box-border h-11 max-sm:h-[42px] max-sm:mt-9 pr-[5px] pl-4 bg-surface-card border border-border rounded-lg mt-6">
      <span className="flex text-ink-muted">
        <Search size={18} strokeWidth={1.75} />
      </span>
      <input
        value={q}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Rechercher par produit, ingrédient, catégorie…"
        className="flex-1 min-w-0 text-base text-ink placeholder:text-ink-muted outline-none border-0 bg-transparent"
      />
      <button
        type="button"
        onClick={() => toast(NOT_IN_PROTOTYPE)}
        // Mobile (app capture): round icon-only button.
        className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3 max-sm:w-[30px] max-sm:h-[30px] max-sm:px-0 max-sm:rounded-full text-13 font-semibold text-white bg-linear-to-r from-ai-start to-ai-end rounded-sm border-0"
      >
        <Sparkles {...ICON} />
        <span className="hidden sm:inline">Recherche IA</span>
      </button>
    </label>

    {/* Mobile: one line that scrolls sideways, as in the app. */}
    <div className="flex flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:whitespace-nowrap max-sm:-mr-4 items-center gap-x-6 gap-y-2 mt-3">
      {['Catégories de produits', 'Objectifs de santé', 'Marques'].map((f) => (
        <span key={f} className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
          {f}
          <span className="flex">
            <ChevronDown {...ICON} />
          </span>
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 h-[30px] px-4 rounded-full bg-surface-tint text-brand-900 text-sm font-medium">
        <Sparkles {...ICON} />
        Nouveautés
      </span>
      <span className="inline-flex items-center gap-1.5 h-[30px] px-4 rounded-full bg-accent-peach text-ink text-sm font-medium">
        <TrendingUp {...ICON} />
        Tendance
      </span>
    </div>
    </>
  );
}
