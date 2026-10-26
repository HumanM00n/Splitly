"use client";

import { useActionState } from "react";
import { addMemberAction, removeMemberAction } from "@/app/actions";
import { Button, ErrorMessage, SecondaryButton, inputClass } from "./ui";

type Member = { id: string; name: string };

export function AddMemberForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(
    addMemberAction.bind(null, groupId),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="name"
          aria-label="Nom du membre"
          required
          maxLength={50}
          placeholder="Nom du membre"
          defaultValue={state?.values?.name as string | undefined}
          className={inputClass}
        />
        <Button type="submit" disabled={pending}>
          Ajouter
        </Button>
      </div>
      <ErrorMessage message={state?.error} />
    </form>
  );
}

export function MemberItem({ groupId, member }: { groupId: string; member: Member }) {
  const [state, formAction, pending] = useActionState(
    removeMemberAction.bind(null, groupId, member.id),
    undefined,
  );

  return (
    <li className="py-2">
      <form action={formAction} className="flex items-center justify-between gap-2">
        <span>{member.name}</span>
        <SecondaryButton type="submit" disabled={pending} aria-label={`Retirer ${member.name}`}>
          Retirer
        </SecondaryButton>
      </form>
      <ErrorMessage message={state?.error} />
    </li>
  );
}
