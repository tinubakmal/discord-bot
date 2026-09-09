import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemDetail } from "@/lib/queries";
import { RarityBadge, SchoolBadge } from "@/components/Badges";
import { StatList } from "@/components/StatList";
import { ItemCard } from "@/components/ItemCard";
import { FavoriteButton } from "@/components/FavoriteButton";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({ params }: { params: { slug: string } }) {
  const item = await getItemDetail(params.slug);
  if (!item) notFound();

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="panel-glow flex flex-col items-center gap-4 p-6">
          <div className="relative h-48 w-48 overflow-hidden rounded-xl border border-arcane-700 bg-arcane-800/80">
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt={item.name} fill sizes="192px" className="object-contain p-3" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">
                {item.itemType.icon ?? "✨"}
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            <RarityBadge rarity={item.rarity} />
            {item.schools.map((s) => (
              <SchoolBadge key={s.slug} school={s} />
            ))}
          </div>
          <div className="flex w-full gap-2">
            <Link href={`/compare?ids=${item.id}`} className="btn-primary flex-1">
              ⚖️ Comparer
            </Link>
            <FavoriteButton item={item} />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-wider text-arcane-400">
              {item.itemType.name} - Niveau requis {item.levelRequired}
              {item.set ? (
                <>
                  {" "}
                  - Set{" "}
                  <Link href={`/items?set=${item.set.slug}`} className="text-arcane-gold hover:underline">
                    {item.set.name}
                  </Link>
                </>
              ) : null}
            </p>
            <h1 className="font-display text-3xl font-bold text-arcane-100">{item.name}</h1>
            {item.description ? (
              <p className="mt-2 italic text-arcane-300">&laquo; {item.description} &raquo;</p>
            ) : null}
          </div>

          <div className="panel p-4">
            <h2 className="mb-3 font-display text-lg font-semibold text-arcane-100">
              Statistiques
            </h2>
            <StatList stats={item.stats} />
          </div>

          {item.talents.length > 0 ? (
            <div className="panel p-4">
              <h2 className="mb-3 font-display text-lg font-semibold text-arcane-100">
                Talents &amp; effets
              </h2>
              <ul className="space-y-2">
                {item.talents.map((t) => (
                  <li key={t.slug} className="flex items-start gap-2 text-sm">
                    <span>{t.icon ?? "✨"}</span>
                    <div>
                      <p className="font-medium text-arcane-100">{t.name}</p>
                      {t.description ? (
                        <p className="text-arcane-400">{t.description}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="panel p-4">
            <h2 className="mb-3 font-display text-lg font-semibold text-arcane-100">
              Source d&apos;obtention
            </h2>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {item.world ? (
                <div>
                  <dt className="text-arcane-400">Monde</dt>
                  <dd className="text-arcane-100">{item.world.name}</dd>
                </div>
              ) : null}
              {item.zone ? (
                <div>
                  <dt className="text-arcane-400">Zone</dt>
                  <dd className="text-arcane-100">{item.zone.name}</dd>
                </div>
              ) : null}
              {item.boss ? (
                <div>
                  <dt className="text-arcane-400">Boss / PNJ</dt>
                  <dd className="text-arcane-100">{item.boss.name}</dd>
                </div>
              ) : null}
              {item.sourceText ? (
                <div className="sm:col-span-2">
                  <dt className="text-arcane-400">Details</dt>
                  <dd className="text-arcane-100">{item.sourceText}</dd>
                </div>
              ) : null}
              {!item.world && !item.zone && !item.boss && !item.sourceText ? (
                <p className="text-arcane-400">Source inconnue.</p>
              ) : null}
            </dl>
          </div>
        </div>
      </div>

      {item.set && item.set.pieces.length > 1 ? (
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-arcane-100">
            Set {item.set.name}
          </h2>
          {item.set.description ? (
            <p className="mb-4 text-sm text-arcane-400">{item.set.description}</p>
          ) : null}
          {item.set.bonuses.length > 0 ? (
            <div className="panel mb-4 p-4">
              <h3 className="mb-2 text-sm font-semibold text-arcane-200">Bonus d&apos;ensemble</h3>
              <ul className="space-y-2 text-sm">
                {item.set.bonuses.map((bonus) => (
                  <li key={bonus.piecesRequired} className="flex flex-wrap items-center gap-2">
                    <span className="badge">{bonus.piecesRequired} pieces</span>
                    <span className="text-arcane-300">{bonus.description}</span>
                    <span className="flex flex-wrap gap-1">
                      {bonus.stats.map((s) => (
                        <span key={s.key} className="badge">
                          {s.name} {s.value > 0 ? "+" : ""}
                          {s.value}
                          {s.unit === "%" ? "%" : ""}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {item.set.pieces.map((piece) => (
              <ItemCard key={piece.id} item={piece} />
            ))}
          </div>
        </section>
      ) : null}

      {item.similar.length > 0 ? (
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-arcane-100">
            Items similaires
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {item.similar.map((s) => (
              <ItemCard key={s.id} item={s} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
