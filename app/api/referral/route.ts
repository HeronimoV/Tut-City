import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { trackReferral } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "No referral code" }, { status: 400 });

  const userId = (session.user as any).id;
  const referral = await trackReferral(code, userId);

  return NextResponse.json({ tracked: !!referral });
}
