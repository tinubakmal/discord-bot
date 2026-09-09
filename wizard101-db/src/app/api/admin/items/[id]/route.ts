import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminItem, upsertAdminItem, type AdminItemPayload } from "@/lib/queries";
import { slugify } from "@/lib/slugify";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const item = await getAdminItem(params.id);
  if (!item) return NextResponse.json({ error: "Item introuvable" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const item = await upsertAdminItem(payload, params.id);
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json(
      { error: `Mise a jour impossible (slug deja utilise ?) : ${(err as Error).message}` },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.item.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Suppression impossible : ${(err as Error).message}` }, { status: 400 });
  }
}
