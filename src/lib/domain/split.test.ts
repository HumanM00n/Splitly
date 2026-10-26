import { describe, expect, it } from "vitest";
import { splitEqually } from ".";

const total = (shares: { shareCents: number }[]) => shares.reduce((s, x) => s + x.shareCents, 0);

describe("splitEqually", () => {
  it("répartit 10,00 € / 3 en 3,34 / 3,33 / 3,33", () => {
    expect(splitEqually(1000, ["a", "b", "c"])).toEqual([
      { memberId: "a", shareCents: 334 },
      { memberId: "b", shareCents: 333 },
      { memberId: "c", shareCents: 333 },
    ]);
  });

  it("donne les centimes restants aux premiers participants", () => {
    expect(splitEqually(1001, ["a", "b", "c"]).map((s) => s.shareCents)).toEqual([334, 334, 333]);
  });

  it("répartit exactement un montant divisible", () => {
    expect(splitEqually(900, ["a", "b", "c"]).map((s) => s.shareCents)).toEqual([300, 300, 300]);
  });

  it("donne tout au participant unique", () => {
    expect(splitEqually(1234, ["a"])).toEqual([{ memberId: "a", shareCents: 1234 }]);
  });

  it("gère un montant plus petit que le nombre de participants", () => {
    expect(splitEqually(2, ["a", "b", "c"]).map((s) => s.shareCents)).toEqual([1, 1, 0]);
  });

  it("est déterministe", () => {
    expect(splitEqually(1000, ["x", "y", "z"])).toEqual(splitEqually(1000, ["x", "y", "z"]));
  });

  it.each([
    [1, 7],
    [100, 3],
    [9999, 7],
    [123457, 11],
  ])("conserve la somme (%i centimes / %i)", (amount, count) => {
    const ids = Array.from({ length: count }, (_, i) => `m${i}`);
    const shares = splitEqually(amount, ids);
    expect(total(shares)).toBe(amount);
    const values = shares.map((s) => s.shareCents);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });

  it.each([0, -100, 10.5])("rejette le montant %j", (amount) => {
    expect(() => splitEqually(amount, ["a"])).toThrow(RangeError);
  });

  it("rejette une liste de participants vide", () => {
    expect(() => splitEqually(100, [])).toThrow("au moins un participant");
  });

  it("rejette un participant en double", () => {
    expect(() => splitEqually(100, ["a", "a"])).toThrow("qu'une fois");
  });
});
