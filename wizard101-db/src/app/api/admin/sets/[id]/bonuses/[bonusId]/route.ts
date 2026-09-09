import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type BonusStatInput = { statDefinitionId: string; value: number };

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; bonusId: string } }
) {
  const body = await request.json().catch(() => ({}));
  const piecesRequired = Number(body.piecesRequired);
  const stats: BonusStatInput[] = Array.isArray(body.stats) ? body.stats : [];
  if (!piecesRequired || piecesRequired < 1) {
    return NextResponse.json({ error: "Nombre de pieces requis invalide" }, { status: 400 });
  }
  await prisma.setBonusStat.deleteMany({ where: { setBonusId: params.bonusId } });
  const bonus = await prisma.setBonus.update({
    where: { id: params.bonusId },
    data: {
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
  return NextResponse.json(bonus);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; bonusId: string } }
) {
  await prisma.setBonus.delete({ where: { id: params.bonusId } });
  return NextResponse.json({ ok: true });
}
