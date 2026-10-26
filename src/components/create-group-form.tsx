"use client";

import { useActionState } from "react";
import { createGroupAction } from "@/app/actions";
import { Button, ErrorMessage, inputClass } from "./ui";

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState(createGroupAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor="group-name" className="text-sm font-medium">
        Nom du groupe
      </label>
      <div className="flex gap-2">
        <input
          id="group-name"
          name="name"
          required
          maxLength={50}
          placeholder="Ex. Week-end à Lisbonne"
          defaultValue={state?.values?.name as string | undefined}
          className={inputClass}
        />
        <Button type="submit" disabled={pending}>
          Créer
        </Button>
      </div>
      <ErrorMessage message={state?.error} />
    </form>
  );
}
