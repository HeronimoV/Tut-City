import { createServerClient } from "./supabase";

const supabase = () => createServerClient();

// ─── Profiles ───────────────────────────────────────────────

export async function getProfile(userId: string) {
  const { data, error } = await supabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createProfile(userId: string, email: string, displayName: string) {
  const { data, error } = await supabase()
    .from("profiles")
    .upsert({ id: userId, email, display_name: displayName }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Solves ─────────────────────────────────────────────────

export async function recordSolve(
  userId: string,
  solveData: {
    subject: string;
    problem_description?: string;
    answer?: string;
    concept?: string;
    steps?: any;
    understanding_score?: number;
    comprehension_results?: Record<string, boolean>;
    time_spent_seconds?: number;
  }
) {
  const { data, error } = await supabase()
    .from("solves")
    .insert({ user_id: userId, ...solveData })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Concept Scores ─────────────────────────────────────────

export async function updateConceptScores(
  userId: string,
  subject: string,
  concept: string,
  firstTryCorrect: boolean,
  score: number
) {
  // Upsert concept score
  const existing = await supabase()
    .from("concept_scores")
    .select("*")
    .eq("user_id", userId)
    .eq("subject", subject)
    .eq("concept", concept)
    .single();

  if (existing.data) {
    const { error } = await supabase()
      .from("concept_scores")
      .update({
        attempts: existing.data.attempts + 1,
        correct_first_try: existing.data.correct_first_try + (firstTryCorrect ? 1 : 0),
        total_score: existing.data.total_score + score,
        last_attempted: new Date().toISOString(),
      })
      .eq("id", existing.data.id);
    if (error) throw error;
  } else {
    const { error } = await supabase()
      .from("concept_scores")
      .insert({
        user_id: userId,
        subject,
        concept,
        attempts: 1,
        correct_first_try: firstTryCorrect ? 1 : 0,
        total_score: score,
        last_attempted: new Date().toISOString(),
      });
    if (error) throw error;
  }
}

// ─── Weaknesses ─────────────────────────────────────────────

export async function calculateWeaknesses(userId: string) {
  const { data: scores } = await supabase()
    .from("concept_scores")
    .select("*")
    .eq("user_id", userId);

  if (!scores) return;

  // Delete old weaknesses
  await supabase().from("user_weaknesses").delete().eq("user_id", userId);

  const weaknesses = scores
    .filter((s) => s.attempts >= 2 && s.correct_first_try / s.attempts < 0.6)
    .map((s) => {
      const rate = s.correct_first_try / s.attempts;
      return {
        user_id: userId,
        subject: s.subject,
        concept: s.concept,
        weakness_score: 1 - rate,
        recommendation: `Practice more ${s.concept} problems in ${s.subject}. You got ${Math.round(rate * 100)}% correct on first try.`,
        updated_at: new Date().toISOString(),
      };
    });

  if (weaknesses.length > 0) {
    await supabase().from("user_weaknesses").insert(weaknesses);
  }
}

// ─── Progress ───────────────────────────────────────────────

export async function getStudentProgress(userId: string) {
  const { data: solves } = await supabase()
    .from("solves")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: conceptScores } = await supabase()
    .from("concept_scores")
    .select("*")
    .eq("user_id", userId);

  const allSolves = solves || [];
  const allConcepts = conceptScores || [];

  // Solves by subject
  const bySubject: Record<string, { count: number; totalScore: number }> = {};
  for (const s of allSolves) {
    if (!bySubject[s.subject]) bySubject[s.subject] = { count: 0, totalScore: 0 };
    bySubject[s.subject].count++;
    bySubject[s.subject].totalScore += s.understanding_score || 0;
  }

  const subjectBreakdown = Object.entries(bySubject).map(([subject, d]) => ({
    subject,
    count: d.count,
    avgScore: d.count > 0 ? Math.round(d.totalScore / d.count) : 0,
  }));

  // Streak calculation
  const solveDates = Array.from(new Set(allSolves.map((s) => s.created_at.split("T")[0]))).sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = new Date(today);
  for (const d of solveDates) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (d === dateStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (d < dateStr) {
      break;
    }
  }

  const totalScore = allSolves.reduce((sum, s) => sum + (s.understanding_score || 0), 0);

  return {
    totalSolves: allSolves.length,
    avgScore: allSolves.length > 0 ? Math.round(totalScore / allSolves.length) : 0,
    streak,
    subjectBreakdown,
    recentSolves: allSolves.slice(0, 10).map((s) => ({
      subject: s.subject,
      concept: s.concept,
      score: s.understanding_score,
      date: s.created_at,
    })),
    conceptScores: allConcepts,
  };
}

export async function getWeaknesses(userId: string) {
  const { data } = await supabase()
    .from("user_weaknesses")
    .select("*")
    .eq("user_id", userId)
    .order("weakness_score", { ascending: false });
  return data || [];
}

export async function getStrengths(userId: string) {
  const { data: scores } = await supabase()
    .from("concept_scores")
    .select("*")
    .eq("user_id", userId);

  return (scores || [])
    .filter((s) => s.attempts >= 2 && s.correct_first_try / s.attempts >= 0.8)
    .map((s) => ({
      subject: s.subject,
      concept: s.concept,
      rate: Math.round((s.correct_first_try / s.attempts) * 100),
    }));
}

// ─── Access Control ─────────────────────────────────────────

export async function checkAccess(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) return { hasAccess: false, reason: "no_profile", trialRemaining: 3 };

  if (profile.has_subscription || profile.has_promo_access) {
    return { hasAccess: true, reason: "paid", trialRemaining: 0 };
  }

  const remaining = Math.max(0, (profile.free_solve_limit || 3) - (profile.free_solves_used || 0));
  return {
    hasAccess: remaining > 0,
    reason: remaining > 0 ? "trial" : "exhausted",
    trialRemaining: remaining,
    isPaid: false,
  };
}

export async function incrementFreeSolves(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) return;
  await supabase()
    .from("profiles")
    .update({ free_solves_used: (profile.free_solves_used || 0) + 1 })
    .eq("id", userId);
}

// ─── Promo Codes ────────────────────────────────────────────

export async function validateAndApplyPromo(userId: string, code: string) {
  const upper = code.toUpperCase().trim();
  const { data: promo, error } = await supabase()
    .from("promo_codes")
    .select("*")
    .eq("code", upper)
    .single();

  if (error || !promo) return { valid: false, message: "Invalid promo code 😕" };
  if (!promo.active) return { valid: false, message: "This code is no longer active 😢" };
  if (promo.expires_at && new Date(promo.expires_at) < new Date())
    return { valid: false, message: "This code has expired 😢" };
  if (promo.type === "single-use" && promo.uses >= 1)
    return { valid: false, message: "This code has already been used 😢" };
  if (promo.type === "limited" && promo.max_uses && promo.uses >= promo.max_uses)
    return { valid: false, message: "This code has been fully redeemed 😢" };

  // Increment uses
  await supabase()
    .from("promo_codes")
    .update({ uses: promo.uses + 1 })
    .eq("code", upper);

  // Grant access to user
  await supabase()
    .from("profiles")
    .update({ has_promo_access: true, promo_code_used: upper })
    .eq("id", userId);

  return {
    valid: true,
    message: promo.type === "unlimited" ? "VIP access activated! 🎉✨" : "Promo code applied! Enjoy free access! 🎊",
  };
}

export async function getPromoStats() {
  const { data } = await supabase().from("promo_codes").select("*");
  return data || [];
}

export async function createPromoCode(params: {
  code: string;
  type: string;
  description?: string;
  max_uses?: number;
  expires_at?: string;
}) {
  const upper = params.code.toUpperCase().trim();
  const { data, error } = await supabase()
    .from("promo_codes")
    .insert({
      code: upper,
      type: params.type,
      description: params.description,
      max_uses: params.max_uses,
      expires_at: params.expires_at,
      active: true,
      uses: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePromoCode(
  code: string,
  updates: { active?: boolean; max_uses?: number; expires_at?: string; description?: string }
) {
  const upper = code.toUpperCase().trim();
  const { data, error } = await supabase()
    .from("promo_codes")
    .update(updates)
    .eq("code", upper)
    .select()
    .single();
  if (error) throw error;
  return data;
}
