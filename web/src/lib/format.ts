/** 2590 -> "25,90 €" */
export const euros = (cents: number) =>
  `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/** "Jean Dupont" -> "JD" */
export const initials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

/** ISO -> "22/11/26 · 16:44" (as in the patient page of the reference) */
export function shortDateTime(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** "1984-05-12" -> "12/05/1984" */
export const frenchDate = (isoDate: string) => isoDate.split('-').reverse().join('/');

/** « 22/11/2026 » from an ISO timestamp. */
export const numericDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');
