import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Star, X } from '../ui/icons';
import { useState } from 'react';
import { api } from '../api/client';
import type { Product } from '../api/types';
import { useRefresh } from '../hooks/queries';
import { euros } from '../lib/format';
import { UNIT_LABELS } from '../lib/wording';
import { cx } from '../ui/utils';

/**
 * Product picture. The reference pictures already contain the favorite star (top right):
 * a transparent button sits on top of it, and a filled star covers it once the product is a favorite.
 * Mocked products without a picture get a neutral placeholder with the same proportions.
 */
export function ProductImage({ product, className }: { product: Product; className?: string }) {
  const qc = useQueryClient();
  const refresh = useRefresh();
  const [fav, setFav] = useState(product.isFavorite);
  const [prevFav, setPrevFav] = useState(product.isFavorite);
  if (product.isFavorite !== prevFav) {
    setPrevFav(product.isFavorite);
    setFav(product.isFavorite);
  }

  async function toggle() {
    const next = !fav;
    setFav(next);
    await (next ? api.addFavorite(product.uid) : api.removeFavorite(product.uid));
    await qc.invalidateQueries({ queryKey: ['products'] });
    await qc.invalidateQueries({ queryKey: ['favorites'] });
    refresh.onboarding();
  }

  return (
    // Mobile (app capture): taller picture box (3:2), the picture centered on the same light background.
    // The star is a 30 px white round button in the box corner (the star drawn in the picture is masked).
    <div className={cx('max-sm:relative max-sm:aspect-[3/2] max-sm:flex max-sm:items-center max-sm:bg-surface-page max-sm:rounded-md', className)}>
      <div className="relative w-full">
        {product.image ? (
          <img src={product.image} alt="" className="block w-full h-auto rounded-md" />
        ) : (
          <div className="w-full aspect-[492/224] rounded-md bg-surface-subtle flex items-center justify-center">
            <span className="w-[22%] aspect-[3/4] rounded-md bg-surface-card border border-border flex items-center justify-center text-11 font-semibold text-ink-muted text-center px-1 leading-tight">
              {product.brand}
            </span>
          </div>
        )}
        <button
          type="button"
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={fav}
          onClick={toggle}
          className={cx(
            'absolute right-[3.3%] top-[7.3%] w-[12.6%] aspect-square rounded-full flex items-center justify-center border-0 p-0',
            fav || !product.image ? 'bg-surface-card' : 'bg-transparent',
            // Mobile: masks the star drawn in the picture; the real button is the one below.
            'max-sm:bg-surface-page max-sm:pointer-events-none',
          )}
        >
          {(fav || !product.image) && (
            <Star className="w-[45%] h-[45%] text-amber max-sm:hidden" fill={fav ? 'currentColor' : 'none'} strokeWidth={1.75} />
          )}
        </button>
      </div>
      <button
        type="button"
        aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-pressed={fav}
        onClick={toggle}
        className="sm:hidden absolute right-2 top-[9px] w-[30px] h-[30px] rounded-full bg-surface-card flex items-center justify-center border-0 p-0 text-amber"
      >
        <Star size={16} strokeWidth={1.75} fill={fav ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

export function Price({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-2 mt-2 mb-3 max-sm:mb-6 max-sm:flex-wrap max-sm:gap-y-1 whitespace-nowrap text-sm">
      {product.discountPct > 0 && <span className="line-through text-ink-muted">{euros(product.priceCents)}</span>}
      <span className="font-semibold text-ink">{euros(product.discountedPriceCents)}</span>
      <span className="text-ink-muted">/{UNIT_LABELS[product.unit]}</span>
      {product.discountPct > 0 && (
        <span className="py-0.5 px-2 rounded-full bg-surface-tint text-13 font-semibold text-ink">-{product.discountPct}%</span>
      )}
    </div>
  );
}

/** Same card everywhere: « Pour démarrer », favorites, « Les plus recommandés », search results. */
export function ProductCard({
  product,
  added,
  onAdd,
  onRemove,
}: {
  product: Product;
  added: boolean;
  onAdd: (quantity: number) => void;
  onRemove: () => void;
}) {
  const [qty, setQty] = useState(1);
  return (
    <div className="max-sm:h-full">
      {/* Mobile: the cards of a row have the same height and their buttons are aligned at the bottom. */}
      <section
        className={cx(
          'box-border p-3 bg-surface-card border rounded-lg max-sm:h-full max-sm:flex max-sm:flex-col',
          added ? 'border-brand-link' : 'border-border',
        )}
      >
        <ProductImage product={product} />
        <div className="mt-2 max-sm:mt-2.5 text-base font-semibold text-ink min-h-12 max-sm:min-h-0">{product.name}</div>
        <div className="mt-1 max-sm:mt-2.5">
          {/* As in the reference: a format selector for jars and sachets, plain text for bottles. */}
          {product.unit === 'bottle' ? (
            <div className="h-9 flex items-center text-13 leading-4 text-ink-muted">{product.format}</div>
          ) : (
            <div className="flex items-center box-border h-9 max-sm:h-auto max-sm:min-h-9 max-sm:py-1.5 px-3 border border-border rounded-md text-13 leading-4 text-ink-muted">
              <span className="flex-1 max-sm:line-clamp-2">{product.format}</span>
              <ChevronDown size={14} strokeWidth={1.75} />
            </div>
          )}
        </div>
        <Price product={product} />
        {added ? (
          <button
            type="button"
            onClick={onRemove}
            className="group w-full flex items-center justify-center box-border h-[41px] max-sm:h-10 max-sm:mt-auto max-sm:flex-none border border-brand-900 rounded-sm text-sm font-medium text-brand-900 bg-transparent hover:bg-surface-neutral"
          >
            <span className="inline-flex items-center gap-1.5 group-hover:hidden">
              <Check size={14} strokeWidth={2} />
              Déjà ajouté
            </span>
            <span className="hidden group-hover:inline-flex items-center gap-1.5">
              <X size={14} strokeWidth={1.75} />
              Retirer
            </span>
          </button>
        ) : (
          <div className="flex box-border h-[41px] max-sm:h-10 max-sm:mt-auto max-sm:flex-none border border-border max-sm:border-0 rounded-sm overflow-hidden">
            {/* No quantity stepper on mobile (app capture): « Ajouter » takes the whole width. */}
            <span className="flex-[0_0_116px] max-sm:hidden flex items-center justify-between px-3 text-sm text-ink">
              <button type="button" aria-label="Moins" onClick={() => setQty((q) => Math.max(1, q - 1))} className="border-0 bg-transparent p-0 text-ink">
                -
              </button>
              <span>{qty}</span>
              <button type="button" aria-label="Plus" onClick={() => setQty((q) => Math.min(99, q + 1))} className="border-0 bg-transparent p-0 text-ink">
                +
              </button>
            </span>
            <button
              type="button"
              onClick={() => onAdd(qty)}
              className="flex-1 flex items-center justify-center text-sm font-medium max-sm:text-base max-sm:font-normal text-white bg-brand-900 border-0"
            >
              Ajouter
            </button>
          </div>
        )}
        <label className="flex items-center gap-2 mt-3 max-sm:mt-4 text-sm text-ink-muted">
          <span className="w-4 h-4 box-border border border-border rounded-[4px]" />
          Comparer
        </label>
      </section>
    </div>
  );
}
