import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { createExpenseAction } from "@/app/actions";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { ExpenseForm } from "@/components/expense-form";
import { AddMemberForm, MemberItem } from "@/components/members";
import { Card } from "@/components/ui";
import { formatCents, formatDate, toIsoDate } from "@/lib/domain";
import { NotFoundError } from "@/lib/errors";
import { getGroupSummary, type GroupSummary } from "@/lib/services/groups";

export default function GroupPage({ params }: PageProps<"/groups/[groupId]">) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
      <GroupView params={params} />
    </Suspense>
  );
}

async function loadGroup(groupId: string) {
  try {
    return await getGroupSummary(groupId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

async function GroupView({ params }: Pick<PageProps<"/groups/[groupId]">, "params">) {
  const { groupId } = await params;
  await connection();
  const group = await loadGroup(groupId);
  const today = toIsoDate(new Date());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Mes groupes
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{group.name}</h1>
      </div>

      <Card title="Remboursements">
        <Settlements group={group} />
      </Card>

      <Card title="Membres">
        {group.members.length > 0 && (
          <ul className="mb-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            {group.members.map((member) => (
              <MemberItem key={member.id} groupId={group.id} member={member} />
            ))}
          </ul>
        )}
        <AddMemberForm groupId={group.id} />
      </Card>

      <Card title="Nouvelle dépense">
        {group.members.length === 0 ? (
          <p className="text-sm text-zinc-500">Ajoutez d&apos;abord des membres au groupe.</p>
        ) : (
          <ExpenseForm
            // Remonte le formulaire quand la liste des membres change
            key={group.members.map((m) => m.id).join()}
            members={group.members}
            submitLabel="Ajouter la dépense"
            action={createExpenseAction.bind(null, group.id)}
            initialValues={{
              label: "",
              amount: "",
              payerId: group.members[0].id,
              participantIds: group.members.map((m) => m.id),
              date: today,
            }}
          />
        )}
      </Card>

      <Card title="Dépenses">
        <Expenses group={group} />
      </Card>

      <Card title="Soldes">
        <Balances group={group} />
      </Card>
    </div>
  );
}

function Settlements({ group }: { group: GroupSummary }) {
  if (group.settlements.length === 0) {
    return <p className="text-sm text-zinc-500">Tout le monde est quitte.</p>;
  }
  return (
    <ul data-testid="settlements" className="flex flex-col gap-1">
      {group.settlements.map((s) => (
        <li key={`${s.from.id}-${s.to.id}`}>
          <strong>{s.from.name}</strong> doit <strong>{formatCents(s.amountCents)}</strong> à{" "}
          <strong>{s.to.name}</strong>
        </li>
      ))}
    </ul>
  );
}

function Expenses({ group }: { group: GroupSummary }) {
  if (group.expenses.length === 0) {
    return <p className="text-sm text-zinc-500">Aucune dépense pour le moment.</p>;
  }
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {group.expenses.map((expense) => (
        <li key={expense.id} className="flex items-start justify-between gap-4 py-3">
          <div>
            <p className="font-medium">{expense.label}</p>
            <p className="text-sm text-zinc-500">
              {formatDate(expense.date)} · payé par {expense.payer.name} · pour{" "}
              {expense.participants.map((p) => p.name).join(", ")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-semibold">{formatCents(expense.amountCents)}</span>
            <div className="flex gap-3">
              <Link
                href={`/groups/${group.id}/expenses/${expense.id}/edit`}
                className="text-sm text-zinc-500 underline-offset-2 hover:underline"
              >
                Modifier
              </Link>
              <DeleteExpenseButton groupId={group.id} expenseId={expense.id} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Balances({ group }: { group: GroupSummary }) {
  if (group.balances.length === 0) {
    return <p className="text-sm text-zinc-500">Aucun membre.</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {group.balances.map((b) => (
        <li key={b.memberId} className="flex justify-between">
          <span>{b.name}</span>
          <span
            className={
              b.balanceCents > 0
                ? "text-green-700 dark:text-green-400"
                : b.balanceCents < 0
                  ? "text-red-700 dark:text-red-400"
                  : "text-zinc-500"
            }
          >
            {b.balanceCents > 0 ? "+" : ""}
            {formatCents(b.balanceCents)}
          </span>
        </li>
      ))}
    </ul>
  );
}
