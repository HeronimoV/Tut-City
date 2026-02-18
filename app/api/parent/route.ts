import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Simple in-memory rate limiting
const lookupCounts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const entry = lookupCounts.get(ip);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 10) {
        return NextResponse.json({ error: "Too many lookups. Try again later." }, { status: 429 });
      }
      entry.count++;
    } else {
      lookupCounts.set(ip, { count: 1, resetAt: now + 3600000 }); // 1 hour window
    }

    const supabase = createServerClient();

    // Find profile by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!profile) {
      return NextResponse.json({ error: "No student found with that email." }, { status: 404 });
    }

    // Get solves
    const { data: solves } = await supabase
      .from("solves")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    const allSolves = solves || [];

    // Subject breakdown
    const bySubject: Record<string, { count: number; totalScore: number }> = {};
    for (const s of allSolves) {
      if (!bySubject[s.subject]) bySubject[s.subject] = { count: 0, totalScore: 0 };
      bySubject[s.subject].count++;
      bySubject[s.subject].totalScore += s.understanding_score || 0;
    }

    const subjects = Object.entries(bySubject).map(([subject, d]) => ({
      subject,
      count: d.count,
      avgScore: d.count > 0 ? Math.round(d.totalScore / d.count) : 0,
    }));

    // Weaknesses
    const { data: weaknesses } = await supabase
      .from("user_weaknesses")
      .select("*")
      .eq("user_id", profile.id);

    // Strengths
    const { data: conceptScores } = await supabase
      .from("concept_scores")
      .select("*")
      .eq("user_id", profile.id);

    const strengths = (conceptScores || [])
      .filter((s: any) => s.attempts >= 2 && s.correct_first_try / s.attempts >= 0.8)
      .map((s: any) => ({ subject: s.subject, concept: s.concept, rate: Math.round((s.correct_first_try / s.attempts) * 100) }));

    // Weekly solves
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklySolves = allSolves.filter((s) => new Date(s.created_at) >= oneWeekAgo);

    const totalScore = allSolves.reduce((sum, s) => sum + (s.understanding_score || 0), 0);
    const totalTime = allSolves.reduce((sum, s) => sum + (s.time_spent_seconds || 0), 0);

    return NextResponse.json({
      name: profile.display_name || "Student",
      totalSolves: allSolves.length,
      avgScore: allSolves.length > 0 ? Math.round(totalScore / allSolves.length) : 0,
      streak: profile.current_streak || 0,
      level: profile.level || 1,
      xp: profile.xp || 0,
      badges: profile.badges || [],
      totalTimeMinutes: Math.round(totalTime / 60),
      subjects,
      strengths,
      weaknesses: weaknesses || [],
      weeklySolves: weeklySolves.length,
      weeklyAvgScore: weeklySolves.length > 0
        ? Math.round(weeklySolves.reduce((sum, s) => sum + (s.understanding_score || 0), 0) / weeklySolves.length)
        : 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
