import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { itemInclude, toItemSummary, toStatValue } from "@/lib/serialize";
import type { StatValue } from "@/lib/stats";

type BuilderResponse = {
  items: ReturnType<typeof toItemSummary>[];
  totals: StatValue[];
  appliedSetBonuses: {
    setName: string;
    piecesEquipped: number;
    piecesRequired: number;
    description: string | null;
    stats: StatValue[];
  }[];
};

/**
 * POST /api/builder/compute
 * body: { itemIds: string[] }
 *
 * Additionne les statistiques de chaque piece d'equipement fournie, puis
 * applique automatiquement les bonus de set dont le seuil de pieces est
 * atteint (tous les paliers <= nombre de pieces equipees du meme set sont
 * cumules, comme dans le jeu).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const itemIds: string[] = Array.isArray(body?.itemIds) ? body.itemIds : [];

  if (itemIds.length === 0) {
    return NextResponse.json(
      { items: [], totals: [], appliedSetBonuses: [] } satisfies BuilderResponse
    );
  }

  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    include: itemInclude,
  });

  // 1) Somme des stats de chaque piece equipee, indexee par cle de stat.
  const totalsByKey = new Map<string, StatValue>();
  const addStat = (stat: StatValue) => {
    const existing = totalsByKey.get(stat.key);
    if (existing) {
      existing.value = Math.round((existing.value + stat.value) * 100) / 100;
    } else {
      totalsByKey.set(stat.key, { ...stat });
    }
  };

  for (const item of items) {
    for (const itemStat of item.stats) {
      addStat(toStatValue(itemStat));
    }
  }

  // 2) Comptage des pieces par set equipe.
  const countsBySet = new Map<string, { count: number; set: (typeof items)[number]["set"] }>();
  for (const item of items) {
    if (!item.set) continue;
    const entry = countsBySet.get(item.set.id) ?? { count: 0, set: item.set };
    entry.count += 1;
    countsBySet.set(item.set.id, entry);
  }

  // 3) Application des bonus de set dont le seuil est atteint.
  const appliedSetBonuses: BuilderResponse["appliedSetBonuses"] = [];
  for (const { count, set } of countsBySet.values()) {
    if (!set) continue;
    for (const bonus of set.bonuses) {
      if (bonus.piecesRequired > count) continue;
      const stats = bonus.stats.map(toStatValue);
      stats.forEach(addStat);
      appliedSetBonuses.push({
        setName: set.name,
        piecesEquipped: count,
        piecesRequired: bonus.piecesRequired,
        description: bonus.description,
        stats,
      });
    }
  }

  const totals = Array.from(totalsByKey.values()).sort((a, b) => a.order - b.order);

  const payload: BuilderResponse = {
    items: items.map(toItemSummary),
    totals,
    appliedSetBonuses,
  };

  return NextResponse.json(payload);
}
