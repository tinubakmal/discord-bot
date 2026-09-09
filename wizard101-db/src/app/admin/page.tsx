import Link from "next/link";
import { prisma } from "@/lib/db";
import { REFERENCE_CONFIGS, REFERENCE_MODEL_KEYS } from "@/lib/adminReference";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [itemCount, setCount] = await Promise.all([prisma.item.count(), prisma.itemSet.count()]);

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold text-arcane-100">Back-office</h1>
      <p className="mb-8 text-arcane-400">
        Gerez items, sets et referentiels sans passer par Prisma Studio ni par un fichier
        JSON/CSV. Usage local, sans compte pour l&apos;instant.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/items" className="panel-glow flex flex-col gap-1 p-5 hover:border-arcane-gold/60">
          <span className="text-3xl">📦</span>
          <p className="mt-2 font-display text-lg font-semibold text-arcane-100">Items</p>
          <p className="text-sm text-arcane-400">{itemCount} items en base</p>
        </Link>

        <Link href="/admin/sets" className="panel-glow flex flex-col gap-1 p-5 hover:border-arcane-gold/60">
          <span className="text-3xl">🎽</span>
          <p className="mt-2 font-display text-lg font-semibold text-arcane-100">Sets &amp; bonus</p>
          <p className="text-sm text-arcane-400">{setCount} sets en base</p>
        </Link>
      </div>

      <h2 className="mb-4 mt-10 font-display text-lg font-semibold text-arcane-100">
        Referentiels
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REFERENCE_MODEL_KEYS.map((key) => (
          <Link
            key={key}
            href={`/admin/reference/${key}`}
            className="panel flex flex-col gap-1 p-4 hover:border-arcane-gold/60"
          >
            <p className="font-display font-semibold text-arcane-100">{REFERENCE_CONFIGS[key].label}</p>
            <p className="text-xs text-arcane-500">Ajouter / modifier / supprimer</p>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-sm text-arcane-500">
        Pour un import en masse (plusieurs items d&apos;un coup), preferez le script{" "}
        <code className="rounded bg-arcane-800/70 px-1.5 py-0.5">npm run import</code> (voir{" "}
        <code className="rounded bg-arcane-800/70 px-1.5 py-0.5">data/IMPORT_GUIDE.md</code>).
      </p>
    </div>
  );
}
