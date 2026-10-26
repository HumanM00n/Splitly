/**
 * Les dates de dépense sont des jours calendaires, stockés à minuit UTC.
 */

/** 2026-10-20T00:00:00Z → "2026-10-20" (format des champs <input type="date">). */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 2026-10-20T00:00:00Z → "20/10/2026". */
export function formatDate(date: Date): string {
  const [year, month, day] = toIsoDate(date).split("-");
  return `${day}/${month}/${year}`;
}
