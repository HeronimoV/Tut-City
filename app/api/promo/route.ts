import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/promo";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ valid: false, message: "Enter a code" }, { status: 400 });
    const result = validatePromoCode(code);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ valid: false, message: "Something went wrong" }, { status: 500 });
  }
}
