import "dotenv/config";
import { prisma } from "@/lib/db/client";
import { createExpense } from "@/lib/services/expenses";
import { createGroup } from "@/lib/services/groups";
import { addMember } from "@/lib/services/members";

const DEMO_GROUP = "Week-end à Lisbonne";

async function main() {
  // Idempotent : on ne recrée pas le groupe de démo s'il existe déjà.
  if (await prisma.group.findFirst({ where: { name: DEMO_GROUP } })) {
    console.log(`Seed ignoré : le groupe « ${DEMO_GROUP} » existe déjà.`);
    return;
  }

  const group = await createGroup({ name: DEMO_GROUP });
  // Ajouts séquentiels : l'ordre des membres (et donc des centimes restants) reste stable.
  const alice = await addMember({ groupId: group.id, name: "Alice" });
  const bob = await addMember({ groupId: group.id, name: "Bob" });
  const chloe = await addMember({ groupId: group.id, name: "Chloé" });
  const everyone = [alice.id, bob.id, chloe.id];

  await createExpense(group.id, {
    label: "Location de l'appartement",
    amount: "300",
    payerId: alice.id,
    participantIds: everyone,
    date: "2026-06-12",
  });
  await createExpense(group.id, {
    label: "Restaurant",
    amount: "85,40",
    payerId: bob.id,
    participantIds: everyone,
    date: "2026-06-13",
  });
  await createExpense(group.id, {
    label: "Tickets de tram",
    amount: "10",
    payerId: chloe.id,
    participantIds: [bob.id, chloe.id],
    date: "2026-06-14",
  });

  console.log(`Seed terminé : groupe « ${DEMO_GROUP} » créé.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
