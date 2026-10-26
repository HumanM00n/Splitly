import { prisma } from "./client";

export function insertMember(groupId: string, name: string) {
  return prisma.member.create({ data: { groupId, name } });
}

export function findMember(memberId: string) {
  return prisma.member.findUnique({ where: { id: memberId } });
}

export function findMemberByName(groupId: string, name: string) {
  return prisma.member.findFirst({
    where: { groupId, name: { equals: name, mode: "insensitive" } },
  });
}

export function findGroupMembers(groupId: string) {
  return prisma.member.findMany({
    where: { groupId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

/** Le membre a-t-il payé ou participé à au moins une dépense ? */
export async function isMemberInvolvedInExpense(memberId: string) {
  const [paid, participations] = await Promise.all([
    prisma.expense.count({ where: { payerId: memberId } }),
    prisma.expenseParticipant.count({ where: { memberId } }),
  ]);
  return paid + participations > 0;
}

export function deleteMember(memberId: string) {
  return prisma.member.delete({ where: { id: memberId } });
}
