import { beforeEach, describe, expect, it } from "vitest";
import { createExpense } from "@/lib/services/expenses";
import { createGroup, getGroupSummary } from "@/lib/services/groups";
import { addMember, removeMember } from "@/lib/services/members";
import { AppError, NotFoundError } from "@/lib/errors";

describe("membres", () => {
  let groupId: string;

  beforeEach(async () => {
    groupId = (await createGroup({ name: "Coloc" })).id;
  });

  it("ajoute des membres dans l'ordre d'arrivée", async () => {
    await addMember({ groupId, name: "Alice" });
    await addMember({ groupId, name: " Bob " });
    const summary = await getGroupSummary(groupId);
    expect(summary.members.map((m) => m.name)).toEqual(["Alice", "Bob"]);
  });

  it("refuse un nom déjà pris dans le groupe, sans tenir compte de la casse", async () => {
    await addMember({ groupId, name: "Alice" });
    await expect(addMember({ groupId, name: "alice" })).rejects.toThrow("déjà ce nom");
  });

  it("autorise le même nom dans deux groupes différents", async () => {
    const other = await createGroup({ name: "Autre" });
    await addMember({ groupId, name: "Alice" });
    await expect(addMember({ groupId: other.id, name: "Alice" })).resolves.toBeTruthy();
  });

  it("refuse un nom vide", async () => {
    await expect(addMember({ groupId, name: " " })).rejects.toThrow(AppError);
  });

  it("refuse un groupe inexistant", async () => {
    await expect(addMember({ groupId: "inexistant", name: "Alice" })).rejects.toThrow(
      NotFoundError,
    );
  });

  it("retire un membre sans dépense", async () => {
    const alice = await addMember({ groupId, name: "Alice" });
    await removeMember(alice.id);
    expect((await getGroupSummary(groupId)).members).toEqual([]);
  });

  it("refuse de retirer un membre introuvable", async () => {
    await expect(removeMember("inexistant")).rejects.toThrow(NotFoundError);
  });

  describe("membre impliqué dans une dépense", () => {
    it("refuse de retirer le payeur", async () => {
      const alice = await addMember({ groupId, name: "Alice" });
      const bob = await addMember({ groupId, name: "Bob" });
      await createExpense(groupId, {
        label: "Courses",
        amount: "20",
        payerId: alice.id,
        participantIds: [bob.id],
        date: "2026-10-01",
      });
      await expect(removeMember(alice.id)).rejects.toThrow("impliqué dans une dépense");
    });

    it("refuse de retirer un participant", async () => {
      const alice = await addMember({ groupId, name: "Alice" });
      const bob = await addMember({ groupId, name: "Bob" });
      await createExpense(groupId, {
        label: "Courses",
        amount: "20",
        payerId: alice.id,
        participantIds: [bob.id],
        date: "2026-10-01",
      });
      await expect(removeMember(bob.id)).rejects.toThrow("impliqué dans une dépense");
      expect((await getGroupSummary(groupId)).members).toHaveLength(2);
    });
  });
});
