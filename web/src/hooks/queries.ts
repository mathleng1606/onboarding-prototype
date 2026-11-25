import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Onboarding } from '../api/types';

/**
 * DATA FROM THE SERVER (react-query)
 *
 * Each screen reads server data with these hooks (usePractitioner, useOnboarding…): react-query fetches it
 * once, keeps it in a cache shared by every screen, and refetches it when it is « invalidated ».
 * `keys` names each cached piece of data; after a change (e.g. a recommendation sent), the screen
 * invalidates the keys whose data changed so they are fetched again.
 */
export const keys = {
  practitioner: ['practitioner'] as const,
  onboarding: ['onboarding'] as const,
  patients: ['patients'] as const,
  patient: (uid: string) => ['patients', uid] as const,
  products: (params: object) => ['products', params] as const,
  favorites: ['favorites'] as const,
  categories: ['categories'] as const,
  recommendations: (params: object) => ['recommendations', params] as const,
  recommendation: (uid: string) => ['recommendation', uid] as const,
  events: ['events'] as const,
};

export const usePractitioner = () => useQuery({ queryKey: keys.practitioner, queryFn: api.practitioner });
export const useOnboarding = () => useQuery({ queryKey: keys.onboarding, queryFn: api.onboarding });
export const usePatients = () => useQuery({ queryKey: keys.patients, queryFn: api.patients });
export const useCategories = () =>
  useQuery({ queryKey: keys.categories, queryFn: api.categories, staleTime: Infinity });

/** After a mutation that can change the checklist: store the fresh value, refresh the rest. */
export function useRefresh() {
  const qc = useQueryClient();
  return {
    onboarding: (value?: Onboarding) =>
      value ? qc.setQueryData(keys.onboarding, value) : qc.invalidateQueries({ queryKey: keys.onboarding }),
    all: () => qc.invalidateQueries(),
  };
}
