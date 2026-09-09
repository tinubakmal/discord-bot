import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { itemInclude, toItemSummary, toStatValue, type ItemWithRelations } from "./serialize";
import type { ItemDetail, ItemsListResponse } from "./types";

export type ItemListFilters = {
  q?: string;
  ids?: string[];
  types?: string[];
  schools?: string[];
  worlds?: string[];
  zones?: string[];
  bosses?: string[];
  rarities?: string[];
  sets?: string[];
  levelMin?: number;
  levelMax?: number;
  /** "key:min:max" (min/max optionnels) */
  statFilters?: string[];
  sort?: "popularity" | "level" | "name" | "recent";
  page?: number;
  pageSize?: number;
};

/**
 * Requete centrale de recherche/filtrage d'items. Utilisee a la fois par la
 * route API /api/items (consommee par le navigateur) et par les Server
 * Components qui peuvent interroger la base directement.
 */
export async function listItems(filters: ItemListFilters): Promise<ItemsListResponse> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 24));

  const where: Prisma.ItemWhereInput = {};

  if (filters.ids?.length) where.id = { in: filters.ids };
  if (filters.q) {
    where.OR = [{ name: { contains: filters.q } }, { description: { contains: filters.q } }];
  }
  if (filters.types?.length) where.itemType = { slug: { in: filters.types } };
  if (filters.worlds?.length) where.world = { slug: { in: filters.worlds } };
  if (filters.zones?.length) where.zone = { slug: { in: filters.zones } };
  if (filters.bosses?.length) where.boss = { slug: { in: filters.bosses } };
  if (filters.rarities?.length) where.rarity = { slug: { in: filters.rarities } };
  if (filters.sets?.length) where.set = { slug: { in: filters.sets } };
  if (filters.schools?.length) {
    where.schools = { some: { school: { slug: { in: filters.schools } } } };
  }
  if (filters.levelMin !== undefined || filters.levelMax !== undefined) {
    where.levelRequired = {
      ...(filters.levelMin !== undefined ? { gte: filters.levelMin } : {}),
      ...(filters.levelMax !== undefined ? { lte: filters.levelMax } : {}),
    };
  }
  if (filters.statFilters?.length) {
    where.AND = filters.statFilters.map((raw) => {
      const [key, minRaw, maxRaw] = raw.split(":");
      const value: Prisma.FloatFilter = {};
      if (minRaw !== undefined && minRaw !== "") value.gte = Number(minRaw);
      if (maxRaw !== undefined && maxRaw !== "") value.lte = Number(maxRaw);
      return {
        stats: {
          some: { statDefinition: { key }, ...(Object.keys(value).length ? { value } : {}) },
        },
      } satisfies Prisma.ItemWhereInput;
    });
  }

  const orderBy: Prisma.ItemOrderByWithRelationInput =
    filters.sort === "popularity"
      ? { popularity: "desc" }
      : filters.sort === "level"
      ? { levelRequired: "asc" }
      : filters.sort === "recent"
      ? { createdAt: "desc" }
      : { name: "asc" };

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: itemInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.item.count({ where }),
  ]);

  return { items: items.map(toItemSummary), total, page, pageSize };
}

/** Score de similarite simple: meme type d'objet, ecole(s) et niveau proches. */
function similarityScore(candidate: ItemWithRelations, reference: ItemWithRelations): number {
  const referenceSchools = new Set(reference.schools.map((s) => s.school.slug));
  let score = 0;
  if (candidate.schools.some((s) => referenceSchools.has(s.school.slug))) score += 2;
  if (Math.abs(candidate.levelRequired - reference.levelRequired) <= 10) score += 1;
  if (candidate.setId && candidate.setId === reference.setId) score += 3;
  return score;
}

export async function getItemDetail(slug: string): Promise<ItemDetail | null> {
  const item = await prisma.item.findUnique({ where: { slug }, include: itemInclude });
  if (!item) return null;

  const candidates = await prisma.item.findMany({
    where: { id: { not: item.id }, itemTypeId: item.itemTypeId },
    include: itemInclude,
    orderBy: { levelRequired: "asc" },
    take: 20,
  });
  const similar = candidates
    .map((candidate) => ({ candidate, score: similarityScore(candidate, item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((s) => toItemSummary(s.candidate));

  let setPayload: ItemDetail["set"] = null;
  if (item.set) {
    const pieces = await prisma.item.findMany({
      where: { setId: item.set.id },
      include: itemInclude,
      orderBy: { name: "asc" },
    });
    setPayload = {
      slug: item.set.slug,
      name: item.set.name,
      description: item.set.description,
      bonuses: item.set.bonuses
        .slice()
        .sort((a, b) => a.piecesRequired - b.piecesRequired)
        .map((b) => ({
          piecesRequired: b.piecesRequired,
          description: b.description,
          stats: b.stats.map(toStatValue),
        })),
      pieces: pieces.map(toItemSummary),
    };
  }

  const summary = toItemSummary(item);
  return {
    ...summary,
    description: item.description,
    world: item.world ? { slug: item.world.slug, name: item.world.name } : null,
    zone: item.zone ? { slug: item.zone.slug, name: item.zone.name } : null,
    boss: item.boss ? { slug: item.boss.slug, name: item.boss.name } : null,
    sourceText: item.sourceText,
    stats: item.stats.map(toStatValue).sort((a, b) => a.order - b.order),
    talents: item.talents.map((t) => ({
      slug: t.talent.slug,
      name: t.talent.name,
      description: t.talent.description,
      icon: t.talent.icon,
    })),
    set: setPayload,
    similar,
  };
}
