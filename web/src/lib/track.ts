import { useEffect, useRef } from 'react';
import { api } from '../api/client';
import type { ChecklistItemKey, RecoFrequency } from '../api/types';
import type { GuideStep, RecoSource } from './flow';

/**
 * PRODUCT ANALYTICS: track(event, props) sends one event to POST /events.
 * The props are typed here and checked again by the server (server/src/services/eventCatalog.ts).
 * Never wait for it and never show its errors: tracking must not break the app.
 * Common props (profession, days_since_signup) and the timestamp are added by the server.
 * Server-only events (signup_completed, reco_sent, checklist_item_completed, checklist_closed,
 * guide_dismissed) are not sent from here.
 */
type EventProps = {
  signup_started: Record<string, never>;
  signup_step_completed: { step: GuideStep; volume_declared?: RecoFrequency };
  guide_step_viewed: { step: GuideStep };
  guide_step_completed: { step: GuideStep };
  reco_started: { source: RecoSource };
  patient_created: { source: PatientSource };
  patient_list_viewed: { n_patients_shown: number };
  favorites_configured: { n_products: number };
  checklist_item_viewed: { item: ChecklistItemKey };
  checklist_item_clicked: { item: ChecklistItemKey };
  checklist_dismissed: { n_items_done: number };
  session_started: Record<string, never>;
  reco_cta_clicked: { location: 'en_tete' | 'checklist' };
};
export type EventName = keyof EventProps;
export type PatientSource = 'checklist' | 'flux_reco' | 'page_patients';

const ANONYMOUS_ID_KEY = 'anonymous-id';

/** Created on the signup page, kept in localStorage until signup_completed. */
export function ensureAnonymousId(): string {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}
export const currentAnonymousId = () => localStorage.getItem(ANONYMOUS_ID_KEY) ?? undefined;
/** After signup_completed the server knows the account: the anonymous id is not needed any more. */
export const forgetAnonymousId = () => localStorage.removeItem(ANONYMOUS_ID_KEY);

export function track<N extends EventName>(name: N, props: EventProps[N]): void {
  api.track(name, props, currentAnonymousId()).catch((err) => console.warn(`[track] ${name} refused`, err));
}

/** Tracks once per key in the given storage (session: this tab; local: this browser). */
export function trackOnce<N extends EventName>(key: string, storage: Storage, name: N, props: EventProps[N]): void {
  const k = `tracked:${key}`;
  if (storage.getItem(k)) return;
  storage.setItem(k, '1');
  track(name, props);
}

/**
 * Tracks when `when` becomes true, once per mount (views: a guide step, a list).
 * The ref keeps React's development double effects from sending it twice.
 */
export function useTrackView<N extends EventName>(when: boolean, name: N, props: EventProps[N]): void {
  const sent = useRef(false);
  useEffect(() => {
    if (!when || sent.current) return;
    sent.current = true;
    track(name, props);
  }, [when, name, props]);
}
