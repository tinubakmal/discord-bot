import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const sets = await prisma.itemSet.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true, bonuses: true } } },
  });
  return NextResponse.json(sets);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!body.name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }
  try {
    const set = await prisma.itemSet.create({
      data: {
        name: body.name,
        slug: body.slug?.trim() || slugify(body.name),
        description: body.description || null,
        popularity: Number(body.popularity ?? 0),
      },
    });
    return NextResponse.json(set, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Creation impossible (slug deja utilise ?) : ${(err as Error).message}` },
      { status: 400 }
    );
  }
}
