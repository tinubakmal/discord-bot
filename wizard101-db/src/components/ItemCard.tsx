import Link from "next/link";
import Image from "next/image";
import type { ItemSummary } from "@/lib/types";
import { RarityBadge, SchoolBadge, StatChip } from "./Badges";

export function ItemCard({
  item,
  selectable,
  selected,
  onToggleSelect,
}: {
  item: ItemSummary;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (item: ItemSummary) => void;
}) {
  const content = (
    <div
      className={`panel group flex h-full flex-col gap-3 p-4 transition hover:border-arcane-gold/60 hover:shadow-glow-gold ${
        selected ? "border-arcane-gold shadow-glow-gold" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-arcane-700 bg-arcane-800/80">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-contain p-1" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">
              {item.itemType.icon ?? "✨"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-arcane-100 group-hover:text-arcane-gold">
            {item.name}
          </p>
          <p className="text-xs text-arcane-400">
            {item.itemType.name} - Niv. {item.levelRequired}
            {item.set ? ` - ${item.set.name}` : ""}
          </p>
        </div>
        {selectable ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleSelect?.(item);
            }}
            className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${
              selected
                ? "border-arcane-gold bg-arcane-gold text-arcane-950"
                : "border-arcane-600 text-arcane-300 hover:border-arcane-gold hover:text-arcane-gold"
            }`}
          >
            {selected ? "Selectionne" : "Comparer"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <RarityBadge rarity={item.rarity} />
        {item.schools.map((s) => (
          <SchoolBadge key={s.slug} school={s} />
        ))}
      </div>

      {item.highlightStats.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {item.highlightStats.map((stat) => (
            <StatChip key={stat.key} stat={stat} />
          ))}
        </div>
      ) : null}
    </div>
  );

  if (selectable) {
    return content;
  }

  return (
    <Link href={`/items/${item.slug}`} className="block h-full">
      {content}
    </Link>
  );
}
