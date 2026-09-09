import type { Prisma } from "@prisma/client";
import type { StatValue } from "./stats";
import type { ItemSummary } from "./types";

// Include Prisma partage par toutes les routes qui renvoient un item, pour
// garder une seule source de verite sur la forme des donnees chargees.
export const itemInclude = {
  itemType: true,
  rarity: true,
  world: true,
  zone: true,
  boss: true,
  set: { include: { bonuses: { include: { stats: { include: { statDefinition: { include: { school: true } } } } } } } },
  schools: { include: { school: true } },
  talents: { include: { talent: true } },
  stats: { include: { statDefinition: { include: { school: true } } } },
} satisfies Prisma.ItemInclude;

export type ItemWithRelations = Prisma.ItemGetPayload<{ include: typeof itemInclude }>;

export function toStatValue(itemStat: {
  value: number;
  statDefinition: {
    key: string;
    name: string;
    shortName: string | null;
    unit: string | null;
    // Stocke en String cote base (SQLite ne supporte pas les enums Prisma) ;
    // on la retype vers l'union StatCategory ici, seul point de conversion.
    category: string;
    icon: string | null;
    order: number;
    school: { slug: string } | null;
  };
}): StatValue {
  const def = itemStat.statDefinition;
  return {
    key: def.key,
    name: def.name,
    shortName: def.shortName,
    unit: def.unit,
    category: def.category as StatValue["category"],
    icon: def.icon,
    order: def.order,
    schoolSlug: def.school?.slug ?? null,
    value: itemStat.value,
  };
}

export function toItemSummary(item: ItemWithRelations): ItemSummary {
  const stats = item.stats.map(toStatValue).sort((a, b) => a.order - b.order);
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    imageUrl: item.imageUrl,
    levelRequired: item.levelRequired,
    itemType: {
      slug: item.itemType.slug,
      name: item.itemType.name,
      icon: item.itemType.icon,
    },
    rarity: item.rarity
      ? { slug: item.rarity.slug, name: item.rarity.name, color: item.rarity.color }
      : null,
    schools: item.schools.map((s) => ({
      slug: s.school.slug,
      name: s.school.name,
      color: s.school.color,
      icon: s.school.icon,
    })),
    set: item.set ? { slug: item.set.slug, name: item.set.name } : null,
    popularity: item.popularity,
    createdAt: item.createdAt.toISOString(),
    highlightStats: stats.slice(0, 3),
    stats,
  };
}
