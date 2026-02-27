import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "@/lib/email-verify";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const valid = await verifyCode(email, code);

    if (!valid) {
      return NextResponse.json({ valid: false, error: "Invalid or expired code. Try again!" }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error("Verify check error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
