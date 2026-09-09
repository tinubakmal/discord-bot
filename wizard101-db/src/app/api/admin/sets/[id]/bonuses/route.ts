import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type BonusStatInput = { statDefinitionId: string; value: number };

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const piecesRequired = Number(body.piecesRequired);
  const stats: BonusStatInput[] = Array.isArray(body.stats) ? body.stats : [];
  if (!piecesRequired || piecesRequired < 1) {
    return NextResponse.json({ error: "Nombre de pieces requis invalide" }, { status: 400 });
  }
  const bonus = await prisma.setBonus.create({
    data: {
      setId: params.id,
      piecesRequired,
      description: body.description || null,
      stats: {
        create: stats
          .filter((s) => s.statDefinitionId)
          .map((s) => ({ statDefinitionId: s.statDefinitionId, value: Number(s.value) })),
      },
    },
    include: { stats: true },
  });
  return NextResponse.json(bonus, { status: 201 });
}
