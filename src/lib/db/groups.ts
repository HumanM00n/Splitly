import { prisma } from "./client";

export function insertGroup(name: string) {
  return prisma.group.create({ data: { name } });
}

export function findGroup(groupId: string) {
  return prisma.group.findUnique({ where: { id: groupId } });
}

export function findGroups() {
  return prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true, expenses: true } } },
  });
}

export function findGroupWithDetails(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      expenses: {
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: { participants: true },
      },
    },
  });
}

export type GroupWithDetails = NonNullable<Awaited<ReturnType<typeof findGroupWithDetails>>>;
