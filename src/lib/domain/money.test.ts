import { describe, expect, it } from "vitest";
import { centsToInput, formatCents, parseAmountToCents } from ".";

describe("parseAmountToCents", () => {
  it.each([
    ["10", 1000],
    ["10,5", 1050],
    ["10.50", 1050],
    ["0,01", 1],
    ["  42,00 ", 4200],
    ["0", 0],
  ])("convertit %j en %i centimes", (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "-5", "10,505", "1e3", "10,", ",50", "10 000"])("rejette %j", (input) => {
    expect(parseAmountToCents(input)).toBeNull();
  });

  it("rejette un montant trop grand pour être un entier sûr", () => {
    expect(parseAmountToCents("999999999999999999")).toBeNull();
  });
});

describe("formatCents", () => {
  it.each([
    [334, "3,34 €"],
    [1000, "10,00 €"],
    [5, "0,05 €"],
    [0, "0,00 €"],
    [-1050, "-10,50 €"],
  ])("formate %i en %j", (cents, expected) => {
    expect(formatCents(cents)).toBe(expected);
  });
});

describe("centsToInput", () => {
  it("formate pour un champ de saisie", () => {
    expect(centsToInput(1234)).toBe("12,34");
  });

  it("fait l'aller-retour avec parseAmountToCents", () => {
    expect(parseAmountToCents(centsToInput(1007))).toBe(1007);
  });
});
