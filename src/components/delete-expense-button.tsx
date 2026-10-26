"use client";

import { useActionState } from "react";
import { deleteExpenseAction } from "@/app/actions";
import { ErrorMessage, SecondaryButton } from "./ui";

export function DeleteExpenseButton({
  groupId,
  expenseId,
}: {
  groupId: string;
  expenseId: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteExpenseAction.bind(null, groupId, expenseId),
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm("Supprimer cette dépense ?")) event.preventDefault();
      }}
    >
      <SecondaryButton type="submit" disabled={pending}>
        Supprimer
      </SecondaryButton>
      <ErrorMessage message={state?.error} />
    </form>
  );
}
