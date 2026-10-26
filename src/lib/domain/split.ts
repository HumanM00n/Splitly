export type Share = { memberId: string; shareCents: number };

/**
 * Répartit équitablement un montant entre des participants.
 * Les centimes restants vont, un par un, aux premiers participants dans l'ordre
 * fourni : 1000 / 3 → 334, 333, 333. Même entrée → même sortie.
 */
export function splitEqually(amountCents: number, participantIds: readonly string[]): Share[] {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new RangeError("Le montant doit être un entier strictement positif (en centimes).");
  }
  if (participantIds.length === 0) {
    throw new RangeError("Il faut au moins un participant.");
  }
  if (new Set(participantIds).size !== participantIds.length) {
    throw new RangeError("Un participant ne peut apparaître qu'une fois.");
  }

  const base = Math.floor(amountCents / participantIds.length);
  const remainder = amountCents % participantIds.length;

  return participantIds.map((memberId, index) => ({
    memberId,
    shareCents: base + (index < remainder ? 1 : 0),
  }));
}
