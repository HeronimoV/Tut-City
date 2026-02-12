import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAccess, getProfile, getStudentProgress } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  try {
    const access = await checkAccess(userId);
    let totalSolves = 0;
    try {
      const progress = await getStudentProgress(userId);
      totalSolves = progress.totalSolves;
    } catch {}
    return NextResponse.json({ ...access, totalSolves });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
