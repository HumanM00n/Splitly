import { splitEqually } from "@/lib/domain";
import { deleteExpense, findExpense, insertExpense, replaceExpense } from "@/lib/db/expenses";
import { findGroupMembers } from "@/lib/db/members";
import { AppError, NotFoundError } from "@/lib/errors";
import { expenseSchema, parseInput } from "@/lib/validation";

/** Valide la saisie et calcule les parts : Zod → domaine. */
async function buildExpenseData(groupId: string, input: unknown) {
  const data = parseInput(expenseSchema, input);
  const members = await findGroupMembers(groupId);
  const memberIds = new Set(members.map((m) => m.id));

  if (!memberIds.has(data.payerId)) {
    throw new AppError("Le payeur doit appartenir au groupe.");
  }
  const selected = new Set(data.participantIds);
  if ([...selected].some((id) => !memberIds.has(id))) {
    throw new AppError("Les participants doivent appartenir au groupe.");
  }

  // Ordre des membres du groupe (et non de la saisie) : la répartition des centimes
  // restants ne dépend donc pas de l'ordre des cases cochées.
  const participantIds = members.map((m) => m.id).filter((id) => selected.has(id));

  return {
    label: data.label,
    amountCents: data.amount,
    date: new Date(`${data.date}T00:00:00.000Z`),
    payerId: data.payerId,
    shares: splitEqually(data.amount, participantIds),
  };
}

export async function createExpense(groupId: string, input: unknown) {
  return insertExpense(groupId, await buildExpenseData(groupId, input));
}

export async function updateExpense(expenseId: string, input: unknown) {
  const expense = await findExpense(expenseId);
  if (!expense) {
    throw new NotFoundError("Dépense introuvable.");
  }
  return replaceExpense(expenseId, await buildExpenseData(expense.groupId, input));
}

export async function removeExpense(expenseId: string) {
  const expense = await findExpense(expenseId);
  if (!expense) {
    throw new NotFoundError("Dépense introuvable.");
  }
  await deleteExpense(expenseId);
  return expense;
}

export async function getExpense(expenseId: string) {
  const expense = await findExpense(expenseId);
  if (!expense) {
    throw new NotFoundError("Dépense introuvable.");
  }
  return expense;
}
