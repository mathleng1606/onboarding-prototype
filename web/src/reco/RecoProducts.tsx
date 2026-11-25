import { useState } from 'react';
import type { ItemInput, Recommendation } from '../api/types';
import { euros } from '../lib/format';
import { Button } from '../ui';
import { ChevronDown, ClipboardList, Info, Minus, Pencil, Plus, Star, Trash2 } from '../ui/icons';
import { useToast } from '../ui/toast';
import { NOT_IN_PROTOTYPE } from '../ui/utils';

/**
 * « Produits » of the recommendation editor: one line per product, with quantity, format, dosage and price.
 * Every change sends the whole list of items to the server (`onItemsChange`), which returns the updated
 * recommendation with its totals.
 */
export function RecoProducts({
  reco,
  onAddProduct,
  onItemsChange,
}: {
  reco: Recommendation;
  /** « Ajouter un produit »: back to the catalogue with the current selection. */
  onAddProduct: () => void;
  onItemsChange: (items: ItemInput[]) => void;
}) {
  const toast = useToast();
  const { totals } = reco;
  /** Current items in the format the API expects. */
  const itemsInput = (): ItemInput[] =>
    reco.items.map((i) => ({ productUid: i.product.uid, quantity: i.quantity, dosage: i.dosage ?? undefined }));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mt-6">
        <h2 className="m-0 flex-1 text-lg font-semibold text-ink">Produits</h2>
        <Button variant="tint" onClick={onAddProduct}>
          <Plus size={16} strokeWidth={1.75} />
          Ajouter un produit
        </Button>
        <Button variant="outline" onClick={() => toast(NOT_IN_PROTOTYPE)}>
          Choisir un protocole
        </Button>
        <span className="inline-flex items-center justify-center box-border w-[42px] h-9 border border-brand-900 rounded-sm text-brand-900">
          <ClipboardList size={16} strokeWidth={1.75} />
        </span>
      </div>

      {reco.items.map((item, idx) => (
        <section key={item.product.uid} className="flex gap-3 mt-3 p-2 bg-surface-card border border-border rounded-lg">
          <span className="flex-none w-[87px] h-[87px] box-border border border-border rounded-sm bg-surface-card overflow-hidden flex items-center justify-center">
            {item.product.image ? (
              <img src={item.product.image} alt="" className="block w-full h-full object-cover" />
            ) : (
              <span className="text-11 font-semibold text-ink-muted">{item.product.brand}</span>
            )}
          </span>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-[180px]">
                <div className="text-base font-semibold text-ink">{item.product.name}</div>
                <div className="text-13 leading-4 tracking-[.04em] text-ink-muted">{item.product.brand}</div>
                <DosageEditor
                  value={item.dosage ?? ''}
                  onSave={(dosage) => onItemsChange(itemsInput().map((it, i) => (i === idx ? { ...it, dosage } : it)))}
                />
              </div>
              <div className="flex-none flex flex-col items-end gap-2">
                <div className="flex items-center gap-3 text-ink-muted">
                  <span className="inline-flex items-center gap-3 h-9 px-2 border border-border rounded-full text-ink">
                    <button
                      type="button"
                      aria-label="Moins"
                      onClick={() => onItemsChange(itemsInput().map((it, i) => (i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it)))}
                      className="flex border-0 bg-transparent p-0 text-ink"
                    >
                      <Minus size={14} strokeWidth={1.75} />
                    </button>
                    <span className="text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Plus"
                      onClick={() => onItemsChange(itemsInput().map((it, i) => (i === idx ? { ...it, quantity: Math.min(99, it.quantity + 1) } : it)))}
                      className="flex border-0 bg-transparent p-0 text-ink"
                    >
                      <Plus size={14} strokeWidth={1.75} />
                    </button>
                  </span>
                  <span className="text-amber flex">
                    <Star size={20} strokeWidth={1.75} />
                  </span>
                  <Info size={18} strokeWidth={1.75} />
                  <button
                    type="button"
                    aria-label="Retirer le produit"
                    onClick={() => onItemsChange(itemsInput().filter((_, i) => i !== idx))}
                    className="text-danger flex border-0 bg-transparent p-0"
                  >
                    <Trash2 size={18} strokeWidth={1.75} />
                  </button>
                </div>
                <span className="inline-flex items-center gap-2 h-9 px-3 border border-border rounded-full text-13 leading-4 text-ink-muted">
                  {item.product.format.replace(/^1 (pot|flacon|sachet) de /, '')}
                  <ChevronDown size={14} strokeWidth={1.75} />
                </span>
              </div>
            </div>
            <div className="self-end flex items-center gap-2 mt-1 text-sm text-ink">
              {totals.discountPct > 0 && <span className="line-through text-ink-muted">{euros(item.lineTotalCents)}</span>}
              <span className="font-semibold">{euros(Math.round((item.lineTotalCents * (100 - totals.discountPct)) / 100))}</span>
              {totals.discountPct > 0 && (
                <span className="py-0.5 px-2 rounded-full bg-surface-tint text-13 font-semibold">-{totals.discountPct}%</span>
              )}
            </div>
          </div>
        </section>
      ))}

      <div className="flex items-center mt-4 py-3 px-4 bg-surface-tint rounded-md text-sm font-medium text-brand-900">
        <span className="flex-1">Tableau récapitulatif des apports nutritionnels</span>
        <ChevronDown size={16} strokeWidth={1.75} />
      </div>
    </>
  );
}

/** Dosage text with a pencil: click to edit, saved on blur or Enter. */
function DosageEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const edit = () => {
    setDraft(value);
    setEditing(true);
  };
  return (
    <div className="mt-1 flex items-center gap-2 text-sm text-ink">
      <button type="button" aria-label="Modifier la posologie" onClick={edit} className="flex border-0 bg-transparent p-0 text-ink">
        <Pencil size={14} strokeWidth={1.75} />
      </button>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft.trim() !== value) onSave(draft.trim());
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="flex-1 min-w-0 h-7 px-2 border border-border rounded-sm text-sm outline-none focus:border-brand-900"
        />
      ) : (
        <span onClick={edit} className="cursor-text">
          {value}
        </span>
      )}
    </div>
  );
}
