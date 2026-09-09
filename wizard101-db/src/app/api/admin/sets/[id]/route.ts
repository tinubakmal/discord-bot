import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const set = await prisma.itemSet.findUnique({
    where: { id: params.id },
    include: {
      bonuses: { include: { stats: true }, orderBy: { piecesRequired: "asc" } },
      items: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!set) return NextResponse.json({ error: "Set introuvable" }, { status: 404 });
  return NextResponse.json(set);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  if (!body.name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  try {
    const set = await prisma.itemSet.update({
      where: { id: params.id },
      data: {
        name: body.name,
        slug: body.slug?.trim() || slugify(body.name),
        description: body.description || null,
        popularity: Number(body.popularity ?? 0),
      },
    });
    return NextResponse.json(set);
  } catch (err) {
    return NextResponse.json({ error: `Mise a jour impossible : ${(err as Error).message}` }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.itemSet.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Suppression impossible : des items reference encore ce set (retirez-les d'abord)." },
      { status: 409 }
    );
  }
}
