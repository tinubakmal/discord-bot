import { NextRequest, NextResponse } from "next/server";
import { listItems, upsertAdminItem, type AdminItemPayload } from "@/lib/queries";
import { slugify } from "@/lib/slugify";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const payload = await listItems({
    q: params.get("q")?.trim() || undefined,
    sort: "name",
    page: Number(params.get("page") ?? "1") || 1,
    pageSize: 30,
  });
  return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Partial<AdminItemPayload> | null;
  if (!body?.name || !body.itemTypeId) {
    return NextResponse.json({ error: "Nom et type d'objet requis" }, { status: 400 });
  }
  const payload: AdminItemPayload = {
    name: body.name,
    slug: body.slug?.trim() || slugify(body.name),
    description: body.description ?? null,
    imageUrl: body.imageUrl ?? null,
    levelRequired: Number(body.levelRequired ?? 1),
    itemTypeId: body.itemTypeId,
    rarityId: body.rarityId ?? null,
    worldId: body.worldId ?? null,
    zoneId: body.zoneId ?? null,
    bossId: body.bossId ?? null,
    setId: body.setId ?? null,
    sourceText: body.sourceText ?? null,
    popularity: Number(body.popularity ?? 0),
    schoolIds: body.schoolIds ?? [],
    talentIds: body.talentIds ?? [],
    stats: body.stats ?? [],
  };
  try {
    const item = await upsertAdminItem(payload);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Creation impossible (slug deja utilise ?) : ${(err as Error).message}` },
      { status: 400 }
    );
  }
}
