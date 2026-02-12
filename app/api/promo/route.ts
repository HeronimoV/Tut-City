import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateAndApplyPromo, createProfile, getProfile } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ valid: false, message: "Please sign in first" }, { status: 401 });

    const userId = (session.user as any).id;
    const { code } = await req.json();
    if (!code) return NextResponse.json({ valid: false, message: "Enter a code" }, { status: 400 });

    // Ensure profile exists
    const profile = await getProfile(userId);
    if (!profile) {
      await createProfile(userId, session.user.email || "", session.user.name || "");
    }

    const result = await validateAndApplyPromo(userId, code);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ valid: false, message: "Something went wrong" }, { status: 500 });
  }
}
