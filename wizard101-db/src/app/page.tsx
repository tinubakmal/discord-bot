import Link from "next/link";
import { prisma } from "@/lib/db";
import { itemInclude, toItemSummary } from "@/lib/serialize";
import { ItemCard } from "@/components/ItemCard";
import { HomeSearch } from "@/components/HomeSearch";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recentRaw, popularRaw, itemTypes, sets, totalItems] = await Promise.all([
    prisma.item.findMany({ include: itemInclude, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.item.findMany({ include: itemInclude, orderBy: { popularity: "desc" }, take: 6 }),
    prisma.itemType.findMany({ orderBy: { name: "asc" } }),
    prisma.itemSet.findMany({
      orderBy: { popularity: "desc" },
      take: 4,
      include: { _count: { select: { items: true } } },
    }),
    prisma.item.count(),
  ]);

  const recent = recentRaw.map(toItemSummary);
  const popular = popularRaw.map(toItemSummary);

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-2xl border border-arcane-700/60 bg-arcane-900/60 px-6 py-14 text-center sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
        <div className="relative mx-auto max-w-2xl">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-arcane-400">
            Base de donnees non-officielle
          </p>
          <h1 className="font-display text-3xl font-bold text-arcane-100 sm:text-5xl">
            Explorez, comparez, optimisez votre <span className="text-arcane-gold">equipement</span>
          </h1>
          <p className="mt-4 text-arcane-300">
            {totalItems} items references. Recherchez un objet, comparez ses statistiques a
            d&apos;autres, et batissez le build parfait pour votre magicien.
          </p>
          <HomeSearch />
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/compare" className="btn-secondary">
              ⚖️ Comparateur d&apos;items
            </Link>
            <Link href="/builder" className="btn-secondary">
              🧙 Createur de build
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-arcane-100">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {itemTypes.map((type) => (
            <Link
              key={type.slug}
              href={`/items?type=${type.slug}`}
              className="badge px-3 py-1.5 text-sm hover:border-arcane-gold hover:text-arcane-gold"
            >
              <span>{type.icon ?? "✨"}</span>
              {type.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-arcane-100">Ajoutes recemment</h2>
          <Link href="/items?sort=recent" className="text-sm text-arcane-gold hover:underline">
            Tout voir
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-arcane-100">Items populaires</h2>
          <Link href="/items?sort=popularity" className="text-sm text-arcane-gold hover:underline">
            Tout voir
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-arcane-100">Sets populaires</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sets.map((set) => (
            <Link
              key={set.slug}
              href={`/items?set=${set.slug}`}
              className="panel flex flex-col gap-1 p-4 hover:border-arcane-gold/60"
            >
              <p className="font-display font-semibold text-arcane-100">{set.name}</p>
              <p className="text-xs text-arcane-400">{set._count.items} pieces</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
