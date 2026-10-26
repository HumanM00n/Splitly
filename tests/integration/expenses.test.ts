import { beforeEach, describe, expect, it } from "vitest";
import { createExpense, getExpense, removeExpense, updateExpense } from "@/lib/services/expenses";
import { createGroup, getGroupSummary } from "@/lib/services/groups";
import { addMember, removeMember } from "@/lib/services/members";
import { AppError, NotFoundError } from "@/lib/errors";

describe("dépenses", () => {
  let groupId: string;
  let alice: string;
  let bob: string;
  let chloe: string;

  beforeEach(async () => {
    groupId = (await createGroup({ name: "Vacances" })).id;
    alice = (await addMember({ groupId, name: "Alice" })).id;
    bob = (await addMember({ groupId, name: "Bob" })).id;
    chloe = (await addMember({ groupId, name: "Chloé" })).id;
  });

  const valid = () => ({
    label: "Restaurant",
    amount: "10,00",
    payerId: alice,
    participantIds: [alice, bob, chloe],
    date: "2026-10-20",
  });

  it("stocke le montant en centimes et répartit les centimes restants", async () => {
    const expense = await createExpense(groupId, valid());
    expect(expense.amountCents).toBe(1000);
    const shares = Object.fromEntries(expense.participants.map((p) => [p.memberId, p.shareCents]));
    expect(shares).toEqual({ [alice]: 334, [bob]: 333, [chloe]: 333 });
  });

  it("répartit selon l'ordre du groupe, pas l'ordre de saisie", async () => {
    const expense = await createExpense(groupId, {
      ...valid(),
      participantIds: [chloe, bob, alice],
    });
    const aliceShare = expense.participants.find((p) => p.memberId === alice);
    expect(aliceShare?.shareCents).toBe(334);
  });

  it.each([
    [{ amount: "0" }, "montant"],
    [{ amount: "-5" }, "montant"],
    [{ amount: "abc" }, "montant"],
    [{ label: " " }, "libellé"],
    [{ participantIds: [] }, "au moins 1 participant"],
    [{ date: "2026-13-45" }, "date"],
    [{ payerId: "" }, "payeur"],
  ])("refuse une saisie invalide %j", async (override, message) => {
    await expect(createExpense(groupId, { ...valid(), ...override })).rejects.toThrow(message);
  });

  it("refuse un payeur d'un autre groupe", async () => {
    const other = await createGroup({ name: "Autre" });
    const stranger = await addMember({ groupId: other.id, name: "Zoé" });
    await expect(createExpense(groupId, { ...valid(), payerId: stranger.id })).rejects.toThrow(
      "payeur doit appartenir au groupe",
    );
  });

  it("refuse un participant d'un autre groupe", async () => {
    const other = await createGroup({ name: "Autre" });
    const stranger = await addMember({ groupId: other.id, name: "Zoé" });
    await expect(
      createExpense(groupId, { ...valid(), participantIds: [alice, stranger.id] }),
    ).rejects.toThrow("participants doivent appartenir au groupe");
  });

  it("liste les dépenses des plus récentes aux plus anciennes", async () => {
    await createExpense(groupId, { ...valid(), label: "Ancienne", date: "2026-01-01" });
    await createExpense(groupId, { ...valid(), label: "Récente", date: "2026-10-01" });
    await createExpense(groupId, { ...valid(), label: "Milieu", date: "2026-05-01" });
    const summary = await getGroupSummary(groupId);
    expect(summary.expenses.map((e) => e.label)).toEqual(["Récente", "Milieu", "Ancienne"]);
  });

  it("modifie une dépense et recalcule les parts", async () => {
    const expense = await createExpense(groupId, valid());
    const updated = await updateExpense(expense.id, {
      label: "Restaurant (corrigé)",
      amount: "15",
      payerId: bob,
      participantIds: [alice, chloe],
      date: "2026-10-21",
    });
    expect(updated).toMatchObject({
      label: "Restaurant (corrigé)",
      amountCents: 1500,
      payerId: bob,
    });
    expect(updated.participants.map((p) => [p.memberId, p.shareCents]).sort()).toEqual(
      [
        [alice, 750],
        [chloe, 750],
      ].sort(),
    );
    // Bob ne participe plus : son ancienne part a disparu
    expect((await getExpense(expense.id)).participants).toHaveLength(2);
  });

  it("ne modifie rien si la saisie est invalide", async () => {
    const expense = await createExpense(groupId, valid());
    await expect(updateExpense(expense.id, { ...valid(), amount: "0" })).rejects.toThrow(AppError);
    expect((await getExpense(expense.id)).amountCents).toBe(1000);
  });

  it("supprime une dépense et ses parts, ce qui libère les membres", async () => {
    const expense = await createExpense(groupId, valid());
    await removeExpense(expense.id);
    await expect(getExpense(expense.id)).rejects.toThrow(NotFoundError);
    await expect(removeMember(chloe)).resolves.toBeTruthy();
  });

  it.each([
    ["modifier", () => updateExpense("inexistant", {})],
    ["supprimer", () => removeExpense("inexistant")],
  ])("signale une dépense introuvable à %s", async (_, action) => {
    await expect(action()).rejects.toThrow(NotFoundError);
  });
});

describe("soldes et remboursements", () => {
  it("calcule les soldes (somme nulle) et les remboursements minimaux", async () => {
    const groupId = (await createGroup({ name: "Week-end" })).id;
    const alice = (await addMember({ groupId, name: "Alice" })).id;
    const bob = (await addMember({ groupId, name: "Bob" })).id;
    const chloe = (await addMember({ groupId, name: "Chloé" })).id;
    const everyone = [alice, bob, chloe];

    await createExpense(groupId, {
      label: "Location",
      amount: "300",
      payerId: alice,
      participantIds: everyone,
      date: "2026-06-12",
    });
    await createExpense(groupId, {
      label: "Restaurant",
      amount: "60",
      payerId: bob,
      participantIds: everyone,
      date: "2026-06-13",
    });

    const summary = await getGroupSummary(groupId);
    expect(summary.balances.map((b) => [b.name, b.balanceCents])).toEqual([
      ["Alice", 18000],
      ["Bob", -6000],
      ["Chloé", -12000],
    ]);
    expect(summary.balances.reduce((s, b) => s + b.balanceCents, 0)).toBe(0);
    expect(summary.settlements.map((s) => [s.from.name, s.to.name, s.amountCents])).toEqual([
      ["Chloé", "Alice", 12000],
      ["Bob", "Alice", 6000],
    ]);
  });
});
