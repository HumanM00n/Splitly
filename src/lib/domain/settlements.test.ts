import { describe, expect, it } from "vitest";
import {
  computeBalances,
  computeSettlements,
  splitEqually,
  type Balance,
  type Settlement,
} from ".";

const b = (memberId: string, balanceCents: number): Balance => ({ memberId, balanceCents });

/** Applique les remboursements aux soldes : tout le monde doit finir à 0. */
function applySettlements(balances: Balance[], settlements: Settlement[]) {
  const result = new Map(balances.map((x) => [x.memberId, x.balanceCents]));
  for (const s of settlements) {
    result.set(s.fromId, result.get(s.fromId)! + s.amountCents);
    result.set(s.toId, result.get(s.toId)! - s.amountCents);
  }
  return [...result.values()];
}

describe("computeSettlements", () => {
  it("ne propose rien quand tout le monde est à 0", () => {
    expect(computeSettlements([b("a", 0), b("b", 0)])).toEqual([]);
  });

  it("ne propose rien sans membre", () => {
    expect(computeSettlements([])).toEqual([]);
  });

  it("ne propose rien pour un membre seul", () => {
    expect(computeSettlements([b("a", 0)])).toEqual([]);
  });

  it("gère un débiteur et un créancier", () => {
    expect(computeSettlements([b("a", 500), b("b", -500)])).toEqual([
      { fromId: "b", toId: "a", amountCents: 500 },
    ]);
  });

  it("fait rembourser le plus gros débiteur au plus gros créancier", () => {
    expect(computeSettlements([b("a", 1500), b("b", -1000), b("c", -500)])).toEqual([
      { fromId: "b", toId: "a", amountCents: 1000 },
      { fromId: "c", toId: "a", amountCents: 500 },
    ]);
  });

  it("répartit un débiteur entre plusieurs créanciers", () => {
    expect(computeSettlements([b("a", 700), b("b", 300), b("c", -1000)])).toEqual([
      { fromId: "c", toId: "a", amountCents: 700 },
      { fromId: "c", toId: "b", amountCents: 300 },
    ]);
  });

  it("départage les égalités par identifiant", () => {
    expect(computeSettlements([b("b", 100), b("a", 100), b("d", -100), b("c", -100)])).toEqual([
      { fromId: "c", toId: "a", amountCents: 100 },
      { fromId: "d", toId: "b", amountCents: 100 },
    ]);
  });

  it("solde tout le monde avec au plus n − 1 transactions", () => {
    const ids = ["a", "b", "c", "d", "e"];
    const balances = computeBalances(ids, [
      { payerId: "a", amountCents: 1000, shares: splitEqually(1000, ids) },
      { payerId: "b", amountCents: 2333, shares: splitEqually(2333, ["b", "c", "d"]) },
      { payerId: "e", amountCents: 1001, shares: splitEqually(1001, ["a", "c"]) },
    ]);
    const settlements = computeSettlements(balances);
    expect(settlements.length).toBeLessThanOrEqual(ids.length - 1);
    expect(settlements.every((s) => s.amountCents > 0)).toBe(true);
    expect(applySettlements(balances, settlements)).toEqual([0, 0, 0, 0, 0]);
  });

  it("rejette des soldes dont la somme n'est pas nulle", () => {
    expect(() => computeSettlements([b("a", 100), b("b", -99)])).toThrow("somme des soldes");
  });
});
