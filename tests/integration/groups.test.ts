import { describe, expect, it } from "vitest";
import { createGroup, getGroupSummary, listGroups } from "@/lib/services/groups";
import { AppError, NotFoundError } from "@/lib/errors";

describe("groupes", () => {
  it("crée un groupe avec un nom nettoyé", async () => {
    const group = await createGroup({ name: "  Coloc  " });
    expect(group.name).toBe("Coloc");
    expect(group.id).toBeTruthy();
  });

  it.each([
    [{ name: "" }, "obligatoire"],
    [{ name: "   " }, "obligatoire"],
    [{}, "obligatoire"],
    [{ name: "x".repeat(51) }, "50 caractères"],
  ])("refuse le nom %j", async (input, message) => {
    await expect(createGroup(input)).rejects.toThrow(AppError);
    await expect(createGroup(input)).rejects.toThrow(message);
  });

  it("accepte un nom de 50 caractères", async () => {
    await expect(createGroup({ name: "x".repeat(50) })).resolves.toBeTruthy();
  });

  it("liste les groupes du plus récent au plus ancien", async () => {
    await createGroup({ name: "Premier" });
    await createGroup({ name: "Second" });
    const groups = await listGroups();
    expect(groups.map((g) => g.name)).toEqual(["Second", "Premier"]);
    expect(groups[0]._count).toEqual({ members: 0, expenses: 0 });
  });

  it("renvoie un résumé vide pour un nouveau groupe", async () => {
    const group = await createGroup({ name: "Vide" });
    const summary = await getGroupSummary(group.id);
    expect(summary).toMatchObject({
      name: "Vide",
      members: [],
      expenses: [],
      balances: [],
      settlements: [],
    });
  });

  it("signale un groupe introuvable", async () => {
    await expect(getGroupSummary("inexistant")).rejects.toThrow(NotFoundError);
  });
});
