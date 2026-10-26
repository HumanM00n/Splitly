import type { Share } from "@/lib/domain";
import { prisma } from "./client";

export type ExpenseData = {
  label: string;
  amountCents: number;
  date: Date;
  payerId: string;
  shares: Share[];
};

export function insertExpense(groupId: string, data: ExpenseData) {
  const { shares, ...fields } = data;
  return prisma.expense.create({
    data: { ...fields, groupId, participants: { create: shares } },
    include: { participants: true },
  });
}

/** Remplace entièrement la dépense et ses parts, dans une transaction. */
export function replaceExpense(expenseId: string, data: ExpenseData) {
  const { shares, ...fields } = data;
  return prisma.$transaction(async (tx) => {
    await tx.expenseParticipant.deleteMany({ where: { expenseId } });
    return tx.expense.update({
      where: { id: expenseId },
      data: { ...fields, participants: { create: shares } },
      include: { participants: true },
    });
  });
}

export function findExpense(expenseId: string) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    include: { participants: true },
  });
}

export function deleteExpense(expenseId: string) {
  return prisma.expense.delete({ where: { id: expenseId } });
}
