import { NextRequest, NextResponse } from "next/server";
import { getDelegate, isReferenceModel, sanitizeReferenceInput, validateRequiredFields } from "@/lib/adminDb";

/**
 * CRUD generique pour les referentiels simples (ecoles, raretes, types
 * d'objets, mondes, zones, boss, talents, definitions de statistiques).
 * Voir src/lib/adminReference.ts pour la configuration par referentiel.
 */
export async function GET(_request: NextRequest, { params }: { params: { model: string } }) {
  if (!isReferenceModel(params.model)) {
    return NextResponse.json({ error: "Referentiel inconnu" }, { status: 404 });
  }
  const rows = await getDelegate(params.model).findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest, { params }: { params: { model: string } }) {
  if (!isReferenceModel(params.model)) {
    return NextResponse.json({ error: "Referentiel inconnu" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const data = sanitizeReferenceInput(params.model, body);
  const validationError = validateRequiredFields(params.model, data);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  try {
    const row = await getDelegate(params.model).create({ data });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Creation impossible (slug/cle deja utilise ?) : ${(err as Error).message}` },
      { status: 400 }
    );
  }
}
