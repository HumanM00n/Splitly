import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <p className="text-zinc-500">Ce groupe ou cette dépense n&apos;existe pas.</p>
      <Link href="/" className="underline">
        Retour à mes groupes
      </Link>
    </div>
  );
}
