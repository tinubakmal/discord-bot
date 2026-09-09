import { NextRequest, NextResponse } from "next/server";
import { getItemDetail } from "@/lib/queries";

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const detail = await getItemDetail(params.slug);
  if (!detail) {
    return NextResponse.json({ error: "Item introuvable" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
