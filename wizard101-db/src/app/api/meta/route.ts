import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { MetaResponse } from "@/lib/types";

// Force le rendu dynamique : sans ca, Next.js tente de pre-rendre cette
// route au moment du build (elle n'a pas de parametre de requete) et
// executerait des requetes Prisma contre une base qui n'existe pas encore
// dans un environnement de build propre (ex: CI).
export const dynamic = "force-dynamic";

// Fournit toutes les listes de reference necessaires aux filtres de
// recherche et aux formulaires (ecoles, mondes/zones, boss, raretes, types
// d'objets, sets, definitions de statistiques). Un seul appel au chargement
// de la page de recherche / du comparateur / du createur de build.
export async function GET() {
  const [schools, worlds, bosses, rarities, itemTypes, sets, statDefinitions] =
    await Promise.all([
      prisma.school.findMany({ orderBy: { name: "asc" } }),
      prisma.world.findMany({
        orderBy: { order: "asc" },
        include: { zones: { orderBy: { name: "asc" } } },
      }),
      prisma.boss.findMany({ orderBy: { name: "asc" } }),
      prisma.rarity.findMany({ orderBy: { order: "asc" } }),
      prisma.itemType.findMany({ orderBy: { name: "asc" } }),
      prisma.itemSet.findMany({ orderBy: { name: "asc" } }),
      prisma.statDefinition.findMany({
        orderBy: { order: "asc" },
        include: { school: true },
      }),
    ]);

  const payload: MetaResponse = {
    schools: schools.map((s) => ({ slug: s.slug, name: s.name, color: s.color, icon: s.icon })),
    worlds: worlds.map((w) => ({
      slug: w.slug,
      name: w.name,
      zones: w.zones.map((z) => ({ slug: z.slug, name: z.name })),
    })),
    bosses: bosses.map((b) => ({ slug: b.slug, name: b.name, zoneSlug: null })),
    rarities: rarities.map((r) => ({ slug: r.slug, name: r.name, color: r.color, order: r.order })),
    itemTypes: itemTypes.map((t) => ({ slug: t.slug, name: t.name, slot: t.slot, icon: t.icon })),
    sets: sets.map((s) => ({ slug: s.slug, name: s.name })),
    statDefinitions: statDefinitions.map((d) => ({
      key: d.key,
      name: d.name,
      shortName: d.shortName,
      unit: d.unit,
      category: d.category,
      schoolSlug: d.school?.slug ?? null,
    })),
  };

  return NextResponse.json(payload);
}
