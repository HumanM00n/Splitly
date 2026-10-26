import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { updateExpenseAction } from "@/app/actions";
import { ExpenseForm } from "@/components/expense-form";
import { Card } from "@/components/ui";
import { centsToInput, toIsoDate } from "@/lib/domain";
import { NotFoundError } from "@/lib/errors";
import { getExpense } from "@/lib/services/expenses";
import { getGroupSummary } from "@/lib/services/groups";

type Props = PageProps<"/groups/[groupId]/expenses/[expenseId]/edit">;

export default function EditExpensePage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
      <EditExpense params={params} />
    </Suspense>
  );
}

async function load(groupId: string, expenseId: string) {
  try {
    const [group, expense] = await Promise.all([getGroupSummary(groupId), getExpense(expenseId)]);
    if (expense.groupId !== group.id) notFound();
    return { group, expense };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

async function EditExpense({ params }: Pick<Props, "params">) {
  const { groupId, expenseId } = await params;
  await connection();
  const { group, expense } = await load(groupId, expenseId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/groups/${group.id}`} className="text-sm text-zinc-500 hover:underline">
          ← {group.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Modifier la dépense</h1>
      </div>
      <Card title={expense.label}>
        <ExpenseForm
          members={group.members}
          submitLabel="Enregistrer"
          action={updateExpenseAction.bind(null, group.id, expense.id)}
          initialValues={{
            label: expense.label,
            amount: centsToInput(expense.amountCents),
            payerId: expense.payerId,
            participantIds: expense.participants.map((p) => p.memberId),
            date: toIsoDate(expense.date),
          }}
        />
      </Card>
    </div>
  );
}
