import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CreateGroupForm } from "@/components/create-group-form";
import { Card } from "@/components/ui";
import { listGroups } from "@/lib/services/groups";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Nouveau groupe">
        <CreateGroupForm />
      </Card>
      <Card title="Mes groupes">
        <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
          <GroupList />
        </Suspense>
      </Card>
    </div>
  );
}

async function GroupList() {
  // Lecture en base à chaque requête : on sort du prérendu.
  await connection();
  const groups = await listGroups();

  if (groups.length === 0) {
    return <p className="text-sm text-zinc-500">Aucun groupe pour le moment.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {groups.map((group) => (
        <li key={group.id}>
          <Link
            href={`/groups/${group.id}`}
            className="flex items-center justify-between py-3 hover:underline"
          >
            <span className="font-medium">{group.name}</span>
            <span className="text-sm text-zinc-500">
              {group._count.members} membre(s) · {group._count.expenses} dépense(s)
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
