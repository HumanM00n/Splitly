import { findGroup } from "@/lib/db/groups";
import {
  deleteMember,
  findMember,
  findMemberByName,
  insertMember,
  isMemberInvolvedInExpense,
} from "@/lib/db/members";
import { AppError, NotFoundError } from "@/lib/errors";
import { addMemberSchema, parseInput } from "@/lib/validation";
import { hasPrismaCode } from "./prisma-errors";

const DUPLICATE_NAME = "Un membre porte déjà ce nom dans le groupe.";
const MEMBER_INVOLVED = "Ce membre est impliqué dans une dépense et ne peut pas être retiré.";

export async function addMember(input: unknown) {
  const { groupId, name } = parseInput(addMemberSchema, input);

  if (!(await findGroup(groupId))) {
    throw new NotFoundError("Groupe introuvable.");
  }
  if (await findMemberByName(groupId, name)) {
    throw new AppError(DUPLICATE_NAME);
  }

  try {
    return await insertMember(groupId, name);
  } catch (error) {
    // Contrainte d'unicité (groupId, name) : deux ajouts simultanés
    if (hasPrismaCode(error, "P2002")) throw new AppError(DUPLICATE_NAME);
    throw error;
  }
}

export async function removeMember(memberId: string) {
  const member = await findMember(memberId);
  if (!member) {
    throw new NotFoundError("Membre introuvable.");
  }
  if (await isMemberInvolvedInExpense(memberId)) {
    throw new AppError(MEMBER_INVOLVED);
  }

  try {
    return await deleteMember(memberId);
  } catch (error) {
    // Clé étrangère : une dépense a été ajoutée entre la vérification et la suppression
    if (hasPrismaCode(error, "P2003")) throw new AppError(MEMBER_INVOLVED);
    throw error;
  }
}
