/** Shapes returned by the API (server/src/services/*). Only uids, never internal ids. */

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

export const RECO_FREQUENCIES = ['none', '1_5', '6_10', '11_20', '21_40', '41_plus'] as const;
export type RecoFrequency = (typeof RECO_FREQUENCIES)[number];

export type Practitioner = {
  uid: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  profession: Profession | null;
  recoFrequency: RecoFrequency | null;
  patientDiscountPct: number;
  discountCode: string | null;
  signupCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistItemKey =
  | 'account'
  | 'test_recommendation'
  | 'favorites'
  | 'real_patient'
  | 'real_recommendation';

export type Onboarding = {
  items: { key: ChecklistItemKey; done: boolean }[];
  doneCount: number;
  total: number;
  nextItem: ChecklistItemKey | null;
  closed: boolean;
  /** Screen 11: first recommendation sent was real, the test was never done. */
  realFirstWithoutTest: boolean;
  hidden: boolean;
  guideActive: boolean;
  showWelcome: boolean;
};

export type Patient = {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  sex: 'male' | 'female' | null;
  isMinor: boolean;
  notes: string | null;
  isTest: boolean;
  origin: 'manual' | 'import';
  createdAt: string;
  updatedAt: string;
};

/** Row of the « Clients » list. */
export type PatientListItem = Patient & { recommendationCount: number; orderCount: number; lastActivityAt: string };

export type PatientDetail = Patient & { recommendations: Recommendation[] };

export type Product = {
  uid: string;
  name: string;
  brand: string;
  format: string;
  unit: 'jar' | 'bottle' | 'sachet';
  category: string;
  image: string | null;
  defaultDosage: string | null;
  priceCents: number;
  discountPct: number;
  discountedPriceCents: number;
  isFavorite: boolean;
};

export type Category = { key: string; label: string };

export type RecommendationItem = {
  product: Pick<Product, 'uid' | 'name' | 'brand' | 'format' | 'unit' | 'image' | 'priceCents'>;
  quantity: number;
  dosage: string | null;
  lineTotalCents: number;
};

export type Recommendation = {
  uid: string;
  status: 'draft' | 'sent';
  isTest: boolean;
  note: string;
  patient: { uid: string; firstName: string; lastName: string; isTest: boolean };
  items: RecommendationItem[];
  totals: { subtotalCents: number; discountPct: number; discountCents: number; totalCents: number };
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
};

export type ItemInput = { productUid: string; quantity: number; dosage?: string };

export type AppEvent = {
  id: number;
  name: string;
  anonymousId: string | null;
  accountUid: string | null;
  props: Record<string, unknown>;
  /** Set by the server. */
  createdAt: string;
};

/** GET /dev/durations: computed from the events when read (server/src/services/durations.ts). */
export type DurationSample = { who: string; startedAt: string; endedAt: string; seconds: number };
export type DurationMeasure = { samples: DurationSample[]; medianSeconds: number | null };
export type Durations = { signup: DurationMeasure; tutorial: DurationMeasure; reco: DurationMeasure };
