import { describe, expect, it } from "vitest";
import { formatDate, toIsoDate } from ".";

const day = new Date("2026-03-07T00:00:00.000Z");

describe("dates", () => {
  it("donne le format ISO d'un jour", () => {
    expect(toIsoDate(day)).toBe("2026-03-07");
  });

  it("formate un jour à la française", () => {
    expect(formatDate(day)).toBe("07/03/2026");
  });
});
