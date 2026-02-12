import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getPromoStats, createPromoCode, updatePromoCode } from "@/lib/db";

export async function GET(req: NextRequest) {
  const err = verifyAdmin(req);
  if (err) return err;
  const codes = await getPromoStats();
  const codesMap: Record<string, any> = {};
  for (const c of codes) codesMap[c.code] = c;
  return NextResponse.json({ codes: codesMap });
}

export async function POST(req: NextRequest) {
  const err = verifyAdmin(req);
  if (err) return err;
  try {
    const { code, type, max_uses, maxUses, expires_at, expiresAt, description } = await req.json();
    if (!code || !type) return NextResponse.json({ error: "code and type required" }, { status: 400 });
    const promo = await createPromoCode({
      code,
      type,
      description,
      max_uses: max_uses || maxUses,
      expires_at: expires_at || expiresAt,
    });
    return NextResponse.json(promo, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const err = verifyAdmin(req);
  if (err) return err;
  try {
    const { code, ...updates } = await req.json();
    if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
    const promo = await updatePromoCode(code, updates);
    return NextResponse.json(promo);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const err = verifyAdmin(req);
  if (err) return err;
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
    await updatePromoCode(code, { active: false });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
