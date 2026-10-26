"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { createExpense, removeExpense, updateExpense } from "@/lib/services/expenses";
import { createGroup } from "@/lib/services/groups";
import { addMember, removeMember } from "@/lib/services/members";

export type FormValues = Record<string, string | string[]>;
export type ActionState = { error?: string; values?: FormValues } | undefined;

/** Exécute une mutation et transforme une erreur métier en message affichable. */
async function attempt(
  mutation: () => Promise<unknown>,
  values?: FormValues,
): Promise<ActionState> {
  try {
    await mutation();
    return undefined;
  } catch (error) {
    if (error instanceof AppError) return { error: error.message, values };
    throw error;
  }
}

const field = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

function expenseValues(formData: FormData) {
  return {
    label: field(formData, "label"),
    amount: field(formData, "amount"),
    payerId: field(formData, "payerId"),
    participantIds: formData.getAll("participantIds").filter((v) => typeof v === "string"),
    date: field(formData, "date"),
  };
}

const groupPath = (groupId: string) => `/groups/${groupId}`;

export async function createGroupAction(_prev: ActionState, formData: FormData) {
  const values = { name: field(formData, "name") };
  let groupId = "";
  const state = await attempt(async () => {
    groupId = (await createGroup(values)).id;
  }, values);
  if (state) return state;

  revalidatePath("/");
  redirect(groupPath(groupId));
}

export async function addMemberAction(groupId: string, _prev: ActionState, formData: FormData) {
  const values = { name: field(formData, "name") };
  const state = await attempt(() => addMember({ groupId, ...values }), values);
  revalidatePath(groupPath(groupId));
  return state;
}

export async function removeMemberAction(groupId: string, memberId: string) {
  const state = await attempt(() => removeMember(memberId));
  revalidatePath(groupPath(groupId));
  return state;
}

export async function createExpenseAction(groupId: string, _prev: ActionState, formData: FormData) {
  const values = expenseValues(formData);
  const state = await attempt(() => createExpense(groupId, values), values);
  revalidatePath(groupPath(groupId));
  return state;
}

export async function updateExpenseAction(
  groupId: string,
  expenseId: string,
  _prev: ActionState,
  formData: FormData,
) {
  const values = expenseValues(formData);
  const state = await attempt(() => updateExpense(expenseId, values), values);
  if (state) return state;

  revalidatePath(groupPath(groupId));
  redirect(groupPath(groupId));
}

export async function deleteExpenseAction(groupId: string, expenseId: string) {
  const state = await attempt(() => removeExpense(expenseId));
  revalidatePath(groupPath(groupId));
  return state;
}
