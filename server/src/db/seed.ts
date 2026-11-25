import { applySchema, dropAll, type DB } from './index.ts';

/**
 * 100 % mocked data. Product labels, formats and prices are copied from
 * reference/prototype-onboarding-simplycure.html; the extra products only fill
 * the catalogue and the per-profession rankings.
 * Uids are fixed so they stay the same after every reset.
 */

export const PRACTITIONER_UID = 'a3f1c7e2-5b8d-4c9e-9f12-6d7e8a9b0c01';
export const TEST_PATIENT_UID = 'b4e2d8f3-6c9e-4d0f-8a23-7e8f9a0b1c02';

export const PROFESSIONS = [
  'naturopath',
  'dietitian',
  'general_practitioner',
  'nutrition_physician',
  'functional_physician',
  'nutritionist',
  'micronutritionist',
] as const;
export type Profession = (typeof PROFESSIONS)[number];

type SeedProduct = {
  key: string; // seed-only handle, also the image file name
  uid: string;
  name: string;
  brand: string;
  format: string;
  unit: 'jar' | 'bottle' | 'sachet';
  priceCents: number;
  category: 'vitamins' | 'minerals' | 'omega_3' | 'amino_acids' | 'gemmotherapy' | 'multivitamins';
  defaultDosage: string;
  starterRank?: number;
  hasImage?: boolean; // false for the mocked additions (no picture in the reference)
};

const uid = (n: number) => `7d1b0f5a-2c3e-4f60-9a1b-${String(n).padStart(12, '0')}`;

export const PRODUCTS: SeedProduct[] = [
  // From the reference
  { key: 'omega-3-epax', uid: uid(1), name: 'Oméga 3 EPAX®', brand: 'NUTRIPURE', format: '1 pot de 90 capsules molles (122 g)', unit: 'jar', priceCents: 2590, category: 'omega_3', defaultDosage: 'Prendre 1 capsule molle 3 fois par jour pendant le repas.', starterRank: 1 },
  { key: 'magnesium-taurine-b6', uid: uid(2), name: 'Magnésium Taurine B6', brand: 'NUTRIPURE', format: '1 pot de 60 gélules (59 g)', unit: 'jar', priceCents: 1490, category: 'minerals', defaultDosage: 'Prendre 2 gélules par jour.', starterRank: 2 },
  { key: 'vitamine-d3k2-forte-2000', uid: uid(3), name: 'Vitamine D3K2 Forte (2000 UI)', brand: "Dr. Jacob's", format: '1 flacon de 600 gouttes (20 ml)', unit: 'bottle', priceCents: 4320, category: 'vitamins', defaultDosage: 'Prendre 1 goutte par jour.', starterRank: 3 },
  { key: 'magnesium-bisglycinate', uid: uid(4), name: 'Magnésium bisglycinate chélaté (gélules)', brand: "Dynveo", format: '1 pot de 60 gélules (55.3 g)', unit: 'jar', priceCents: 1190, category: 'minerals', defaultDosage: 'Prendre 2 gélules par jour.' },
  { key: 'vitamine-d3k2-mk7-3000', uid: uid(5), name: 'Vitamine D3 K2-MK7 (3000 UI)', brand: 'NUTRIPURE', format: '1 flacon de 450 gouttes (20 ml)', unit: 'bottle', priceCents: 2490, category: 'vitamins', defaultDosage: 'Prendre 1 goutte par jour.' },
  { key: 'vitamine-d3k2-mk7-1000', uid: uid(6), name: 'Vitamine D3 K2-MK7 (1000 UI)', brand: 'NUTRIPURE', format: '1 flacon de 450 gouttes (20 ml)', unit: 'bottle', priceCents: 1990, category: 'vitamins', defaultDosage: 'Prendre 1 goutte par jour.' },
  { key: 'multivitamines', uid: uid(7), name: 'Multivitamines', brand: 'NUTRIPURE', format: '1 pot de 60 gélules (45 g)', unit: 'jar', priceCents: 2290, category: 'multivitamins', defaultDosage: 'Prendre 1 gélule par jour.' },
  { key: 'l-glutamine-biokyowa', uid: uid(8), name: 'L-Glutamine BioKyowa®', brand: 'NUTRIPURE', format: '1 sachet de 30 dosettes (150 g)', unit: 'sachet', priceCents: 1290, category: 'amino_acids', defaultDosage: 'Prendre 1 dosette par jour.' },
  { key: 'gemmotherapie-figuier', uid: uid(9), name: 'Gemmothérapie de Figuier', brand: "Herbiolys", format: '1 flacon de 1000 gouttes (50 ml)', unit: 'bottle', priceCents: 1890, category: 'gemmotherapy', defaultDosage: 'Prendre 15 gouttes par jour.' },
  // Mocked additions
  { key: 'vitamine-c-liposomale', hasImage: false, uid: uid(10), name: 'Vitamine C liposomale', brand: 'NUTRIPURE', format: '1 pot de 60 gélules (40 g)', unit: 'jar', priceCents: 2190, category: 'vitamins', defaultDosage: 'Prendre 1 gélule par jour.' },
  { key: 'vitamine-b12', hasImage: false, uid: uid(11), name: 'Vitamine B12 méthylcobalamine', brand: 'NUTRIPURE', format: '1 flacon de 600 gouttes (20 ml)', unit: 'bottle', priceCents: 1590, category: 'vitamins', defaultDosage: 'Prendre 1 goutte par jour.' },
  { key: 'zinc-bisglycinate', hasImage: false, uid: uid(12), name: 'Zinc bisglycinate', brand: 'NUTRIPURE', format: '1 pot de 60 gélules (30 g)', unit: 'jar', priceCents: 1090, category: 'minerals', defaultDosage: 'Prendre 1 gélule par jour.' },
  { key: 'fer-bisglycinate', hasImage: false, uid: uid(13), name: 'Fer bisglycinate', brand: 'NUTRIPURE', format: '1 pot de 60 gélules (30 g)', unit: 'jar', priceCents: 1290, category: 'minerals', defaultDosage: 'Prendre 1 gélule par jour.' },
  { key: 'omega-3-vegetal', hasImage: false, uid: uid(14), name: 'Oméga 3 végétal (huile d’algue)', brand: 'NUTRIPURE', format: '1 pot de 60 capsules (70 g)', unit: 'jar', priceCents: 2790, category: 'omega_3', defaultDosage: 'Prendre 2 capsules par jour pendant le repas.' },
];

/** Top 8 per profession. Naturopath = order of the reference grid. */
export const RANKINGS: Record<Profession, string[]> = {
  naturopath: ['magnesium-taurine-b6', 'omega-3-epax', 'magnesium-bisglycinate', 'vitamine-d3k2-mk7-3000', 'vitamine-d3k2-mk7-1000', 'multivitamines', 'l-glutamine-biokyowa', 'gemmotherapie-figuier'],
  dietitian: ['multivitamines', 'omega-3-epax', 'vitamine-d3k2-mk7-1000', 'magnesium-bisglycinate', 'fer-bisglycinate', 'vitamine-b12', 'omega-3-vegetal', 'zinc-bisglycinate'],
  general_practitioner: ['vitamine-d3k2-mk7-1000', 'magnesium-bisglycinate', 'fer-bisglycinate', 'vitamine-b12', 'omega-3-epax', 'multivitamines', 'zinc-bisglycinate', 'vitamine-c-liposomale'],
  nutrition_physician: ['omega-3-epax', 'vitamine-d3k2-mk7-3000', 'magnesium-bisglycinate', 'zinc-bisglycinate', 'vitamine-b12', 'multivitamines', 'fer-bisglycinate', 'l-glutamine-biokyowa'],
  functional_physician: ['omega-3-epax', 'l-glutamine-biokyowa', 'vitamine-d3k2-forte-2000', 'magnesium-taurine-b6', 'zinc-bisglycinate', 'vitamine-c-liposomale', 'vitamine-b12', 'multivitamines'],
  nutritionist: ['multivitamines', 'magnesium-bisglycinate', 'omega-3-vegetal', 'vitamine-d3k2-mk7-1000', 'vitamine-c-liposomale', 'fer-bisglycinate', 'zinc-bisglycinate', 'vitamine-b12'],
  micronutritionist: ['magnesium-taurine-b6', 'vitamine-d3k2-mk7-3000', 'omega-3-epax', 'zinc-bisglycinate', 'l-glutamine-biokyowa', 'vitamine-c-liposomale', 'magnesium-bisglycinate', 'vitamine-b12'],
};

/**
 * Inserts the initial state: a practitioner who has not signed up yet,
 * the test patient Jean Dupont, and the catalogue. No recommendation, no favorite.
 */
export function seed(db: DB): void {
  db.transaction(() => {
    const practitionerId = db
      .prepare(`INSERT INTO practitioners (uid) VALUES (?)`)
      .run(PRACTITIONER_UID).lastInsertRowid;

    db.prepare(
      `INSERT INTO patients (uid, practitioner_id, first_name, last_name, email, phone, is_test, origin)
       VALUES (?, ?, 'Jean', 'Dupont', 'jean.dupont@example.com', '32456789078', 1, 'manual')`,
    ).run(TEST_PATIENT_UID, practitionerId);

    const insertProduct = db.prepare(
      `INSERT INTO products (uid, name, brand, format, unit, price_cents, category, default_dosage, image, starter_rank)
       VALUES (@uid, @name, @brand, @format, @unit, @priceCents, @category, @defaultDosage, @image, @starterRank)`,
    );
    const idByKey = new Map<string, number | bigint>();
    for (const p of PRODUCTS) {
      const { lastInsertRowid } = insertProduct.run({
        ...p,
        image: p.hasImage === false ? null : `/products/${p.key}.png`,
        starterRank: p.starterRank ?? null,
      });
      idByKey.set(p.key, lastInsertRowid);
    }

    const insertRank = db.prepare(
      `INSERT INTO product_profession_ranks (product_id, profession, rank) VALUES (?, ?, ?)`,
    );
    for (const profession of PROFESSIONS) {
      RANKINGS[profession].forEach((key, i) => {
        const productId = idByKey.get(key);
        if (productId === undefined) throw new Error(`Unknown product key in ranking: ${key}`);
        insertRank.run(productId, profession, i + 1);
      });
    }
  })();
}

export function isSeeded(db: DB): boolean {
  return (db.prepare(`SELECT COUNT(*) AS n FROM practitioners`).get() as { n: number }).n > 0;
}

/** Drop everything, recreate the schema, seed. Also used by POST /dev/reset. */
export function resetDatabase(db: DB): void {
  dropAll(db);
  applySchema(db);
  seed(db);
}
