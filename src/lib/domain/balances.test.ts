import { describe, expect, it } from "vitest";
import { computeBalances, splitEqually } from ".";

const sum = (balances: { balanceCents: number }[]) =>
  balances.reduce((s, b) => s + b.balanceCents, 0);

describe("computeBalances", () => {
  it("met tout le monde à 0 sans dépense", () => {
    expect(computeBalances(["a", "b"], [])).toEqual([
      { memberId: "a", balanceCents: 0 },
      { memberId: "b", balanceCents: 0 },
    ]);
  });

  it("calcule payé − dû", () => {
    const balances = computeBalances(
      ["a", "b", "c"],
      [{ payerId: "a", amountCents: 1000, shares: splitEqually(1000, ["a", "b", "c"]) }],
    );
    expect(balances).toEqual([
      { memberId: "a", balanceCents: 666 },
      { memberId: "b", balanceCents: -333 },
      { memberId: "c", balanceCents: -333 },
    ]);
    expect(sum(balances)).toBe(0);
  });

  it("cumule plusieurs dépenses", () => {
    const balances = computeBalances(
      ["a", "b", "c"],
      [
        { payerId: "a", amountCents: 3000, shares: splitEqually(3000, ["a", "b", "c"]) },
        { payerId: "b", amountCents: 1500, shares: splitEqually(1500, ["a", "b", "c"]) },
        { payerId: "c", amountCents: 1000, shares: splitEqually(1000, ["b", "c"]) },
      ],
    );
    expect(balances).toEqual([
      { memberId: "a", balanceCents: 1500 },
      { memberId: "b", balanceCents: -500 },
      { memberId: "c", balanceCents: -1000 },
    ]);
    expect(sum(balances)).toBe(0);
  });

  it("laisse à 0 un membre seul qui paie pour lui-même", () => {
    expect(
      computeBalances(
        ["a"],
        [{ payerId: "a", amountCents: 500, shares: splitEqually(500, ["a"]) }],
      ),
    ).toEqual([{ memberId: "a", balanceCents: 0 }]);
  });

  it("gère un payeur qui ne participe pas", () => {
    const balances = computeBalances(
      ["a", "b"],
      [{ payerId: "a", amountCents: 1001, shares: splitEqually(1001, ["b"]) }],
    );
    expect(balances).toEqual([
      { memberId: "a", balanceCents: 1001 },
      { memberId: "b", balanceCents: -1001 },
    ]);
  });

  it("rejette un payeur inconnu", () => {
    expect(() =>
      computeBalances(
        ["a"],
        [{ payerId: "z", amountCents: 100, shares: splitEqually(100, ["a"]) }],
      ),
    ).toThrow("Membre inconnu : z");
  });

  it("rejette un participant inconnu", () => {
    expect(() =>
      computeBalances(
        ["a"],
        [{ payerId: "a", amountCents: 100, shares: splitEqually(100, ["z"]) }],
      ),
    ).toThrow("Membre inconnu : z");
  });

  it("rejette des parts dont la somme diffère du montant", () => {
    expect(() =>
      computeBalances(
        ["a", "b"],
        [{ payerId: "a", amountCents: 100, shares: [{ memberId: "b", shareCents: 99 }] }],
      ),
    ).toThrow("somme des parts");
  });
});
