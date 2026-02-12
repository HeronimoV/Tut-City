import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStudentProgress, getWeaknesses, getStrengths } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  try {
    const [progress, weaknesses, strengths] = await Promise.all([
      getStudentProgress(userId),
      getWeaknesses(userId),
      getStrengths(userId),
    ]);

    return NextResponse.json({
      ...progress,
      weaknesses: weaknesses.map((w) => ({
        subject: w.subject,
        concept: w.concept,
        score: w.weakness_score,
        recommendation: w.recommendation,
      })),
      strengths,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
