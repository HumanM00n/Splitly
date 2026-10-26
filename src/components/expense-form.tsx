"use client";

import { useActionState } from "react";
import type { ActionState, FormValues } from "@/app/actions";
import { Button, ErrorMessage, inputClass } from "./ui";

type Member = { id: string; name: string };

export type ExpenseFormValues = {
  label: string;
  amount: string;
  payerId: string;
  participantIds: string[];
  date: string;
};

type Props = {
  members: Member[];
  initialValues: ExpenseFormValues;
  submitLabel: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

/** Formulaire d'ajout ou de modification d'une dépense. */
export function ExpenseForm({ members, initialValues, submitLabel, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // Après une erreur, on réaffiche la saisie (React réinitialise le formulaire après l'action).
  const values = (state?.values as (FormValues & ExpenseFormValues) | undefined) ?? initialValues;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Libellé
          <input
            name="label"
            required
            maxLength={100}
            defaultValue={values.label}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Montant (€)
          <input
            name="amount"
            required
            inputMode="decimal"
            placeholder="12,50"
            defaultValue={values.amount}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Payé par
          <select name="payerId" required defaultValue={values.payerId} className={inputClass}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Date
          <input
            type="date"
            name="date"
            required
            defaultValue={values.date}
            className={inputClass}
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">Pour qui ?</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="participantIds"
                value={m.id}
                defaultChecked={values.participantIds.includes(m.id)}
              />
              {m.name}
            </label>
          ))}
        </div>
      </fieldset>

      <ErrorMessage message={state?.error} />
      <div>
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
