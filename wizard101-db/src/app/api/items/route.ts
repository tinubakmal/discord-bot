import { NextRequest, NextResponse } from "next/server";
import { listItems } from "@/lib/queries";

function splitParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

/**
 * GET /api/items - recherche et filtrage combinable des items.
 * Voir ItemListFilters (src/lib/queries.ts) pour le detail des parametres :
 * q, ids, type, school, world, zone, boss, rarity, set, levelMin, levelMax,
 * stat (repetable, "cle:min:max"), sort, page, pageSize.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const payload = await listItems({
    q: params.get("q")?.trim() || undefined,
    ids: splitParam(params.get("ids")),
    types: splitParam(params.get("type")),
    schools: splitParam(params.get("school")),
    worlds: splitParam(params.get("world")),
    zones: splitParam(params.get("zone")),
    bosses: splitParam(params.get("boss")),
    rarities: splitParam(params.get("rarity")),
    sets: splitParam(params.get("set")),
    levelMin: params.get("levelMin") ? Number(params.get("levelMin")) : undefined,
    levelMax: params.get("levelMax") ? Number(params.get("levelMax")) : undefined,
    statFilters: params.getAll("stat"),
    sort: (params.get("sort") as "popularity" | "level" | "name" | "recent") ?? "name",
    page: Number(params.get("page") ?? "1") || 1,
    pageSize: Number(params.get("pageSize") ?? "24") || 24,
  });

  return NextResponse.json(payload);
}
