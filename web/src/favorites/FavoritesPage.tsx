import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from '../ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { keys, useCategories } from '../hooks/queries';
import { pagePadding } from '../layout/AppShell';
import { track } from '../lib/track';
import { ProductImage, Price } from '../catalogue/ProductCard';
import { Button } from '../ui';
import { cx } from '../ui/utils';

/**
 * FAVORITES SETUP (screen 8), simple version: choose categories, then star products.
 * A star click saves the favorite right away (PUT/DELETE /favorites/:productUid); « Terminer » goes back to the catalogue.
 * Not in the reference HTML: built from the prompt, in the catalogue style.
 */
export function FavoritesPage() {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const [chosen, setChosen] = useState<string[]>([]);
  const [step, setStep] = useState<'categories' | 'products'>('categories');
  const { data: products = [] } = useQuery({ queryKey: keys.products({}), queryFn: () => api.products() });
  const favoritesCount = products.filter((p) => p.isFavorite).length;
  const visible = products.filter((p) => chosen.includes(p.category));

  const toggle = (key: string) => setChosen((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));

  return (
    <div className={pagePadding}>
      <button
        type="button"
        onClick={() => (step === 'products' ? setStep('categories') : navigate(-1))}
        className="flex items-center gap-1 text-sm text-ink-muted bg-transparent border-0 p-0"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Retour
      </button>
      <h1 className="mt-1 mb-0 text-2xl font-semibold text-ink">Configurons vos favoris</h1>

      {step === 'categories' ? (
        <>
          <p className="mt-2 mb-0 text-base text-ink-muted">Choisissez les catégories qui vous intéressent.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={chosen.includes(c.key)}
                onClick={() => toggle(c.key)}
                className={cx(
                  'inline-flex items-center h-[30px] box-border px-3 rounded-full text-sm text-ink border',
                  chosen.includes(c.key) ? 'bg-surface-tint border-brand-900' : 'bg-surface-card border-border',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Button disabled={chosen.length === 0} onClick={() => setStep('products')} className="mt-6">
            Voir les produits
          </Button>
        </>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="m-0 flex-1 text-base text-ink-muted">Cliquez sur l'étoile pour ajouter un produit à vos favoris.</p>
            <span className="text-sm font-medium text-ink">
              {favoritesCount} favori{favoritesCount > 1 ? 's' : ''}
            </span>
            <Button
              onClick={() => {
                track('favorites_configured', { n_products: favoritesCount });
                navigate('/catalogue');
              }}
            >
              Terminer
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {visible.map((p) => (
              <section key={p.uid} className="box-border p-3 bg-surface-card border border-border rounded-lg">
                <ProductImage product={p} />
                <div className="mt-2 text-base font-semibold text-ink min-h-12">{p.name}</div>
                <div className="text-13 text-ink-muted">{p.format}</div>
                <Price product={p} />
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
