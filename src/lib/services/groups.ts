import { computeBalances, computeSettlements } from "@/lib/domain";
import { findGroups, findGroupWithDetails, insertGroup } from "@/lib/db/groups";
import { NotFoundError } from "@/lib/errors";
import { createGroupSchema, parseInput } from "@/lib/validation";

export async function createGroup(input: unknown) {
  const { name } = parseInput(createGroupSchema, input);
  return insertGroup(name);
}

export function listGroups() {
  return findGroups();
}

/** Détail d'un groupe avec les soldes et les remboursements calculés par le domaine. */
export async function getGroupSummary(groupId: string) {
  const group = await findGroupWithDetails(groupId);
  if (!group) {
    throw new NotFoundError("Groupe introuvable.");
  }

  const memberById = new Map(group.members.map((m) => [m.id, m]));
  const memberName = (id: string) => memberById.get(id)!.name;

  const balances = computeBalances(
    group.members.map((m) => m.id),
    group.expenses.map((e) => ({
      payerId: e.payerId,
      amountCents: e.amountCents,
      shares: e.participants,
    })),
  );
  const settlements = computeSettlements(balances);

  return {
    id: group.id,
    name: group.name,
    members: group.members.map((m) => ({ id: m.id, name: m.name })),
    expenses: group.expenses.map((e) => ({
      id: e.id,
      label: e.label,
      amountCents: e.amountCents,
      date: e.date,
      payer: { id: e.payerId, name: memberName(e.payerId) },
      participants: e.participants.map((p) => ({
        id: p.memberId,
        name: memberName(p.memberId),
        shareCents: p.shareCents,
      })),
    })),
    balances: balances.map((b) => ({ ...b, name: memberName(b.memberId) })),
    settlements: settlements.map((s) => ({
      from: { id: s.fromId, name: memberName(s.fromId) },
      to: { id: s.toId, name: memberName(s.toId) },
      amountCents: s.amountCents,
    })),
  };
}

export type GroupSummary = Awaited<ReturnType<typeof getGroupSummary>>;
