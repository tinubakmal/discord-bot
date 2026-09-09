import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Voir la meme note dans /api/meta/route.ts : evite le pre-rendu statique
// au build (cette route n'a pas de parametre de requete).
export const dynamic = "force-dynamic";

/**
 * Variante admin de /api/meta : renvoie les ids bruts (pas seulement les
 * slugs) de tous les referentiels, necessaires pour peupler les selects des
 * formulaires d'edition (item, set...).
 */
export async function GET() {
  const [schools, rarities, itemTypes, worlds, zones, bosses, sets, talents, statDefinitions] =
    await Promise.all([
      prisma.school.findMany({ orderBy: { name: "asc" } }),
      prisma.rarity.findMany({ orderBy: { order: "asc" } }),
      prisma.itemType.findMany({ orderBy: { name: "asc" } }),
      prisma.world.findMany({ orderBy: { order: "asc" } }),
      prisma.zone.findMany({ orderBy: { name: "asc" } }),
      prisma.boss.findMany({ orderBy: { name: "asc" } }),
      prisma.itemSet.findMany({ orderBy: { name: "asc" } }),
      prisma.talent.findMany({ orderBy: { name: "asc" } }),
      prisma.statDefinition.findMany({ orderBy: { order: "asc" } }),
    ]);

  return NextResponse.json({ schools, rarities, itemTypes, worlds, zones, bosses, sets, talents, statDefinitions });
}
