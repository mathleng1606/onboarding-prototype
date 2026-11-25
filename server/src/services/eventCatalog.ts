import { z } from 'zod';
import { HttpError } from '../lib.ts';
import { CHECKLIST_ITEMS } from './onboarding.ts';
import { RECO_FREQUENCIES } from './practitioners.ts';

/**
 * THE TRACKING PLAN: every event the browser may send, with the exact props it may carry.
 * Each props schema is strict: an unknown prop is refused, so nothing else can slip in.
 * Common props are added by the server, never sent: profession (every event),
 * days_since_signup (session_started). The timestamp is the server's.
 */
const step = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const count = z.number().int().min(0).max(10_000);
const none = z.strictObject({});

export const RECO_SOURCES = ['guide', 'accueil', 'checklist', 'patients'] as const;
export const PATIENT_SOURCES = ['checklist', 'flux_reco', 'page_patients'] as const;
export const CTA_LOCATIONS = ['en_tete', 'checklist'] as const;

export const WEB_EVENTS = {
  signup_started: none,
  signup_step_completed: z.strictObject({ step, volume_declared: z.enum(RECO_FREQUENCIES).optional() }),
  guide_step_viewed: z.strictObject({ step }),
  guide_step_completed: z.strictObject({ step }),
  reco_started: z.strictObject({ source: z.enum(RECO_SOURCES) }),
  patient_created: z.strictObject({ source: z.enum(PATIENT_SOURCES) }),
  patient_list_viewed: z.strictObject({ n_patients_shown: count }),
  favorites_configured: z.strictObject({ n_products: count }),
  protocol_created: none,
  tool_connected: z.strictObject({ tool: z.string().regex(/^[a-z][a-z0-9_]*$/).max(40) }),
  checklist_item_viewed: z.strictObject({ item: z.enum(CHECKLIST_ITEMS) }),
  checklist_item_clicked: z.strictObject({ item: z.enum(CHECKLIST_ITEMS) }),
  checklist_dismissed: z.strictObject({ n_items_done: count }),
  session_started: none,
  reco_cta_clicked: z.strictObject({ location: z.enum(CTA_LOCATIONS) }),
} as const;
export type WebEventName = keyof typeof WEB_EVENTS;

/** Written by the server only, on facts: refused from the browser so they cannot be faked. */
export const SERVER_EVENTS = [
  'signup_completed',
  'checklist_item_completed',
  'checklist_closed',
  'guide_dismissed',
  'reco_sent',
] as const;

const envelopeSchema = z.strictObject({
  name: z.string().max(64),
  anonymousId: z.uuid().optional(),
  props: z.record(z.string(), z.unknown()).default({}),
});

// Defence in depth against patient data, on top of the strict schemas: a key that names a person's
// identity or contact, or a value that looks like an e-mail or a phone number, is refused.
const PERSONAL_KEY = /(^|_)(first_?name|last_?name|full_?name|name|nom|prenom|e_?mail|mail|courriel|phone|tel|telephone|birth|birth_?date|naissance|address|adresse)($|_)/i;
const EMAIL_VALUE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_VALUE = /\+?\d[\d\s.-]{7,}\d/;

function personalDataIn(props: Record<string, unknown>): string[] {
  return Object.entries(props).flatMap(([key, value]) => {
    const text = typeof value === 'string' ? value : JSON.stringify(value) ?? '';
    return PERSONAL_KEY.test(key) || EMAIL_VALUE.test(text) || PHONE_VALUE.test(text) ? [key] : [];
  });
}

const refuse = (fieldErrors: Record<string, string[]>) =>
  new HttpError(422, 'validation_error', 'Invalid request', { formErrors: [], fieldErrors });

/** Validates a browser event: envelope, no patient data, known name, exact props. */
export function parseWebEvent(body: unknown) {
  const envelope = envelopeSchema.safeParse(body ?? {});
  if (!envelope.success) {
    throw new HttpError(422, 'validation_error', 'Invalid request', z.flattenError(envelope.error));
  }
  const { name, anonymousId, props } = envelope.data;

  const personal = personalDataIn(props);
  if (personal.length > 0) {
    throw refuse({ props: [`Looks like personal data, never sent in events: ${personal.join(', ')}`] });
  }
  if ((SERVER_EVENTS as readonly string[]).includes(name)) {
    throw refuse({ name: [`${name} is written by the server only`] });
  }
  if (!(name in WEB_EVENTS)) throw refuse({ name: [`Unknown event: ${name}`] });

  const parsed = WEB_EVENTS[name as WebEventName].safeParse(props);
  if (!parsed.success) {
    throw new HttpError(422, 'validation_error', 'Invalid request', {
      formErrors: [],
      fieldErrors: { props: parsed.error.issues.map((i) => `${i.path.join('.') || 'props'}: ${i.message}`) },
    });
  }
  return { name: name as WebEventName, anonymousId, props: parsed.data as Record<string, unknown> };
}
