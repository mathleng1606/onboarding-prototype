import { z } from 'zod';
import type { DB } from '../db/index.ts';
import { bool, HttpError, normalize, notFound } from '../lib.ts';
import type { PractitionerRow } from './practitioners.ts';

export const CATEGORIES = [
  { key: 'vitamins', label: 'Vitamines' },
  { key: 'minerals', label: 'Minéraux' },
  { key: 'omega_3', label: 'Oméga 3' },
  { key: 'amino_acids', label: 'Acides aminés' },
  { key: 'gemmotherapy', label: 'Gemmothérapie' },
  { key: 'multivitamins', label: 'Multivitamines' },
] as const;
const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as [string, ...string[]];

export const productQuerySchema = z.strictObject({
  section: z.enum(['starter', 'popular']).optional(),
  category: z.enum(CATEGORY_KEYS).optional(),
  q: z.string().trim().max(100).optional(),
});

export type ProductRow = {
  id: number;
  uid: string;
  name: string;
  brand: string;
  format: string;
  unit: 'jar' | 'bottle' | 'sachet';
  price_cents: number;
  category: string;
  default_dosage: string | null;
  image: string | null;
  is_favorite: number;
};

/** Prices always come with the practitioner's patient discount applied. */
export function discounted(priceCents: number, pct: number) {
  return Math.round((priceCents * (100 - pct)) / 100);
}

export function toProductDto(r: ProductRow, discountPct: number) {
  return {
    uid: r.uid,
    name: r.name,
    brand: r.brand,
    format: r.format,
    unit: r.unit,
    category: r.category,
    image: r.image,
    defaultDosage: r.default_dosage,
    priceCents: r.price_cents,
    discountPct,
    discountedPriceCents: discounted(r.price_cents, discountPct),
    isFavorite: bool(r.is_favorite),
  };
}

type ListOptions = z.infer<typeof productQuerySchema> & { favoritesOnly?: boolean };

export function listProducts(db: DB, p: PractitionerRow, opts: ListOptions = {}) {
  const join = opts.favoritesOnly ? 'JOIN' : 'LEFT JOIN';
  let sql = `
    SELECT pr.*, (f.product_id IS NOT NULL AND f.deleted_at IS NULL) AS is_favorite
    FROM products pr
    ${join} favorites f ON f.product_id = pr.id AND f.practitioner_id = @pid
                        ${opts.favoritesOnly ? 'AND f.deleted_at IS NULL' : ''}`;
  let order = 'pr.id';
  if (opts.section === 'popular') {
    // The ranking is per profession, and the profession is mandatory (set at signup).
    if (!p.profession) throw new HttpError(409, 'profession_required', 'The practitioner has no profession yet');
    sql += ` JOIN product_profession_ranks r ON r.product_id = pr.id AND r.profession = @profession`;
    order = 'r.rank';
  }
  sql += ` WHERE pr.deleted_at IS NULL`;
  if (opts.section === 'starter') {
    sql += ` AND pr.starter_rank IS NOT NULL`;
    order = 'pr.starter_rank';
  }
  if (opts.category) sql += ` AND pr.category = @category`;
  if (opts.favoritesOnly) order = 'f.created_at, pr.id';

  let rows = db.prepare(`${sql} ORDER BY ${order}`).all({
    pid: p.id,
    profession: p.profession,
    category: opts.category ?? null,
  }) as ProductRow[];

  if (opts.q) {
    const q = normalize(opts.q);
    rows = rows.filter((r) => normalize(`${r.name} ${r.brand}`).includes(q));
  }
  return rows.map((r) => toProductDto(r, p.patient_discount_pct));
}

export function findProductId(db: DB, uid: string): number {
  const row = db.prepare(`SELECT id FROM products WHERE uid = ? AND deleted_at IS NULL`).get(uid) as
    | { id: number }
    | undefined;
  if (!row) throw notFound('product');
  return row.id;
}

/** Re-adding a removed favorite brings the same row back (deleted_at -> NULL). */
export function addFavorite(db: DB, p: PractitionerRow, productUid: string) {
  const productId = findProductId(db, productUid);
  db.prepare(
    `INSERT INTO favorites (practitioner_id, product_id) VALUES (?, ?)
     ON CONFLICT (practitioner_id, product_id) DO UPDATE SET deleted_at = NULL WHERE deleted_at IS NOT NULL`,
  ).run(p.id, productId);
}

export function removeFavorite(db: DB, p: PractitionerRow, productUid: string) {
  const productId = findProductId(db, productUid);
  db.prepare(
    `UPDATE favorites SET deleted_at = datetime('now')
     WHERE practitioner_id = ? AND product_id = ? AND deleted_at IS NULL`,
  ).run(p.id, productId);
}
