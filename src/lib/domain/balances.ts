import type { Share } from "./split";

export type ExpenseForBalance = {
  payerId: string;
  amountCents: number;
  shares: readonly Share[];
};

export type Balance = { memberId: string; balanceCents: number };

/**
 * Solde de chaque membre = ce qu'il a payé − ce qu'il doit.
 * Positif : on lui doit de l'argent. Négatif : il doit de l'argent.
 * Les membres sont renvoyés dans l'ordre fourni ; la somme vaut toujours 0
 * tant que chaque dépense a des parts dont la somme égale son montant.
 */
export function computeBalances(
  memberIds: readonly string[],
  expenses: readonly ExpenseForBalance[],
): Balance[] {
  const balances = new Map<string, number>(memberIds.map((id) => [id, 0]));

  const add = (memberId: string, delta: number) => {
    const current = balances.get(memberId);
    if (current === undefined) {
      throw new Error(`Membre inconnu : ${memberId}`);
    }
    balances.set(memberId, current + delta);
  };

  for (const expense of expenses) {
    const sharesTotal = expense.shares.reduce((sum, share) => sum + share.shareCents, 0);
    if (sharesTotal !== expense.amountCents) {
      throw new Error("La somme des parts doit être égale au montant de la dépense.");
    }
    add(expense.payerId, expense.amountCents);
    for (const share of expense.shares) {
      add(share.memberId, -share.shareCents);
    }
  }

  return memberIds.map((memberId) => ({ memberId, balanceCents: balances.get(memberId)! }));
}
