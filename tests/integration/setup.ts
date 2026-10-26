import { afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/db/client";

beforeEach(async () => {
  // Supprimer les groupes supprime en cascade membres, dépenses et parts.
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Group" CASCADE');
});

afterAll(async () => {
  await prisma.$disconnect();
});
