import type {
  AppEvent,
  Category,
  ItemInput,
  Onboarding,
  Patient,
  PatientDetail,
  PatientListItem,
  Practitioner,
  Product,
  Recommendation,
} from './types';

/**
 * API CLIENT: one function per server endpoint (see the README for the list).
 * Every call goes to /api/practitioners/<PRACTITIONER_UID>/… ; Vite forwards /api to the server (vite.config.ts).
 * The practitioner is fixed by VITE_PRACTITIONER_UID (web/.env): the prototype has no login.
 * An error answer from the server becomes an ApiError (status, code, message).
 */
export const PRACTITIONER_UID: string = import.meta.env.VITE_PRACTITIONER_UID;
if (!PRACTITIONER_UID) throw new Error('VITE_PRACTITIONER_UID is missing (see web/.env.example)');

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    // No content-type without a body: Fastify rejects an empty JSON body.
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code ?? 'http_error', data?.error?.message ?? res.statusText);
  }
  return data as T;
}

const P = `/practitioners/${PRACTITIONER_UID}`;
const qs = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return s ? `?${s}` : '';
};

export const api = {
  practitioner: () => request<Practitioner>('GET', P),
  updatePractitioner: (patch: Partial<Practitioner>) => request<Practitioner>('PATCH', P, patch),
  completeSignup: (anonymousId?: string) =>
    request<Practitioner>('POST', `${P}/signup/complete`, anonymousId ? { anonymousId } : undefined),

  onboarding: () => request<Onboarding>('GET', `${P}/onboarding`),
  skipGuide: (step: 1 | 2 | 3) => request<Onboarding>('POST', `${P}/onboarding/skip-guide`, { step }),
  dismissWelcome: () => request<Onboarding>('POST', `${P}/onboarding/dismiss-welcome`),
  dismissChecklist: () => request<Onboarding>('POST', `${P}/onboarding/dismiss-checklist`),

  patients: () => request<PatientListItem[]>('GET', `${P}/patients`),
  patient: (uid: string) => request<PatientDetail>('GET', `${P}/patients/${uid}`),
  createPatient: (input: Record<string, unknown>) => request<Patient>('POST', `${P}/patients`, input),
  deletePatient: (uid: string) => request<void>('DELETE', `${P}/patients/${uid}`),

  categories: () => request<Category[]>('GET', '/categories'),
  products: (params: { section?: 'starter' | 'popular'; category?: string; q?: string } = {}) =>
    request<Product[]>('GET', `${P}/products${qs(params)}`),
  favorites: () => request<Product[]>('GET', `${P}/favorites`),
  addFavorite: (productUid: string) => request<void>('PUT', `${P}/favorites/${productUid}`),
  removeFavorite: (productUid: string) => request<void>('DELETE', `${P}/favorites/${productUid}`),

  recommendations: (params: { patientUid?: string; status?: 'draft' | 'sent' } = {}) =>
    request<Recommendation[]>('GET', `${P}/recommendations${qs(params)}`),
  recommendation: (uid: string) => request<Recommendation>('GET', `${P}/recommendations/${uid}`),
  createRecommendation: (input: { patientUid: string; items: ItemInput[]; note?: string }) =>
    request<Recommendation>('POST', `${P}/recommendations`, input),
  updateRecommendation: (uid: string, patch: { note?: string; items?: ItemInput[]; patientUid?: string }) =>
    request<Recommendation>('PATCH', `${P}/recommendations/${uid}`, patch),
  deleteRecommendation: (uid: string) => request<void>('DELETE', `${P}/recommendations/${uid}`),
  sendRecommendation: (uid: string, source: 'guide' | 'accueil' | 'checklist' | 'patients') =>
    request<{ recommendation: Recommendation; onboarding: Onboarding }>('POST', `${P}/recommendations/${uid}/send`, { source }),

  events: (limit = 200) => request<AppEvent[]>('GET', `${P}/events?limit=${limit}`),
  track: (name: string, props: Record<string, unknown>, anonymousId?: string) =>
    request<AppEvent>('POST', `${P}/events`, { name, props, ...(anonymousId ? { anonymousId } : {}) }),
  reset: () => request<void>('POST', '/dev/reset'),
};
