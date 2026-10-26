/**
 * Montants manipulés en centimes entiers : jamais de float pour l'argent.
 */

const AMOUNT_PATTERN = /^(\d+)(?:[.,](\d{1,2}))?$/;

/**
 * Convertit une saisie utilisateur ("10", "10,5", "10.50") en centimes.
 * Retourne null si la saisie n'est pas un montant valide.
 */
export function parseAmountToCents(input: string): number | null {
  const match = AMOUNT_PATTERN.exec(input.trim());
  if (!match) return null;
  const euros = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  const total = euros * 100 + cents;
  return Number.isSafeInteger(total) ? total : null;
}

/**
 * Formate des centimes en euros : 334 → "3,34 €", -1050 → "-10,50 €".
 */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  return `${sign}${euros},${rest} €`;
}

/**
 * Formate des centimes pour un champ de saisie : 334 → "3,34".
 */
export function centsToInput(cents: number): string {
  return formatCents(cents).replace(" €", "");
}
