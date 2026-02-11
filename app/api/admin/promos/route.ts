import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deactivatePromoCode,
} from "@/lib/promo";

export async function GET(req: NextRequest) {
  const err = verifyAdmin(req);
  if (err) return err;
  return NextResponse.json({ codes: getAllPromoCodes() });
}

export async function POST(req: NextRequest) {
  const err = verifyAdmin(req);
  if (err) return err;
  try {
    const { code, type, maxUses, expiresAt, description } = await req.json();
    if (!code || !type) {
      return NextResponse.json({ error: "code and type required" }, { status: 400 });
    }
    const promo = createPromoCode(code, { type, maxUses, expiresAt, description });
    return NextResponse.json({ code: code.toUpperCase().trim(), ...promo }, { status: 201 });
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
    const promo = updatePromoCode(code, updates);
    return NextResponse.json({ code: code.toUpperCase().trim(), ...promo });
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
    deactivatePromoCode(code);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
