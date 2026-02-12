import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  recordSolve,
  updateConceptScores,
  calculateWeaknesses,
  incrementFreeSolves,
  checkAccess,
} from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const {
      subject,
      problem_description,
      answer,
      concept,
      steps,
      understanding_score,
      comprehension_results,
      time_spent_seconds,
    } = body;

    if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 });

    // Record the solve
    const solve = await recordSolve(userId, {
      subject,
      problem_description,
      answer,
      concept,
      steps,
      understanding_score,
      comprehension_results,
      time_spent_seconds,
    });

    // Update concept scores if concept provided
    if (concept) {
      // Determine if majority of comprehension checks were first-try correct
      const checks = comprehension_results || {};
      const values = Object.values(checks) as boolean[];
      const firstTryCorrect = values.length > 0
        ? values.filter(Boolean).length / values.length >= 0.5
        : (understanding_score || 0) >= 75;

      await updateConceptScores(userId, subject, concept, firstTryCorrect, understanding_score || 0);
      await calculateWeaknesses(userId);
    }

    // Increment free solves if on trial
    const access = await checkAccess(userId);
    if (access.reason === "trial") {
      await incrementFreeSolves(userId);
    }

    return NextResponse.json({ success: true, solve });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
