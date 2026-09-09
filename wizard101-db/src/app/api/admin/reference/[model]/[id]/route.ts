import { NextRequest, NextResponse } from "next/server";
import { getDelegate, isReferenceModel, sanitizeReferenceInput, validateRequiredFields } from "@/lib/adminDb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { model: string; id: string } }
) {
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
    const row = await getDelegate(params.model).update({ where: { id: params.id }, data });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: `Mise a jour impossible : ${(err as Error).message}` }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { model: string; id: string } }
) {
  if (!isReferenceModel(params.model)) {
    return NextResponse.json({ error: "Referentiel inconnu" }, { status: 404 });
  }
  try {
    await getDelegate(params.model).delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Suppression impossible : cette entree est probablement utilisee par des items existants." },
      { status: 409 }
    );
  }
}
