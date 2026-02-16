import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAffiliateByUserId, createAffiliate, getAffiliateStats } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) return NextResponse.json({ affiliate: null });

  const stats = await getAffiliateStats(affiliate.id);
  return NextResponse.json({ affiliate: stats });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const existing = await getAffiliateByUserId(userId);
  if (existing) return NextResponse.json({ affiliate: existing });

  const { name, code } = await req.json();
  const affiliateCode = (code || name || userId).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);

  try {
    const affiliate = await createAffiliate(
      userId,
      affiliateCode,
      name || session.user.name || "",
      session.user.email || ""
    );
    return NextResponse.json({ affiliate });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "That code is already taken. Try another!" }, { status: 400 });
    }
    throw error;
  }
}
