import type { Balance } from "./balances";

export type Settlement = { fromId: string; toId: string; amountCents: number };

type Position = { memberId: string; amount: number };

const byAmountDesc = (a: Position, b: Position) =>
  b.amount - a.amount || a.memberId.localeCompare(b.memberId);

export function computeSettlements(balances: readonly Balance[]): Settlement[] {
  const total = balances.reduce((sum, b) => sum + b.balanceCents, 0);
  if (total !== 0) {
    throw new Error("La somme des soldes doit valoir 0.");
  }

  const debtors: Position[] = balances
    .filter((b) => b.balanceCents < 0)
    .map((b) => ({ memberId: b.memberId, amount: -b.balanceCents }));
  const creditors: Position[] = balances
    .filter((b) => b.balanceCents > 0)
    .map((b) => ({ memberId: b.memberId, amount: b.balanceCents }));

  const settlements: Settlement[] = [];

  while (debtors.length > 0) {
    debtors.sort(byAmountDesc);
    creditors.sort(byAmountDesc);
    const debtor = debtors[0];
    const creditor = creditors[0];
    const amount = Math.min(debtor.amount, creditor.amount);

    settlements.push({ fromId: debtor.memberId, toId: creditor.memberId, amountCents: amount });

    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtors.shift();
    if (creditor.amount === 0) creditors.shift();
  }

  return settlements;
}
