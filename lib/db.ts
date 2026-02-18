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

// ─── Gamification ───────────────────────────────────────────

const LEVEL_TITLES: Record<number, string> = {
  1: "Beginner", 2: "Learner", 3: "Student", 4: "Scholar", 5: "Expert",
  6: "Master", 7: "Genius", 8: "Legend", 9: "Prodigy",
};

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[level] || "Math God";
}

export async function awardXP(userId: string, amount: number) {
  const profile = await getProfile(userId);
  if (!profile) return;
  const newXP = (profile.xp || 0) + amount;
  const newLevel = Math.max(1, Math.floor(newXP / 500) + 1);
  await supabase()
    .from("profiles")
    .update({ xp: newXP, level: newLevel })
    .eq("id", userId);
  return { xp: newXP, level: newLevel };
}

export async function updateStreak(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) return;

  const today = new Date().toISOString().split("T")[0];
  const lastSolve = profile.last_solve_date;

  let newStreak = profile.current_streak || 0;
  if (lastSolve === today) {
    // Already solved today, no change
    return { streak: newStreak };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastSolve === yesterdayStr) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, profile.longest_streak || 0);

  await supabase()
    .from("profiles")
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_solve_date: today,
    })
    .eq("id", userId);

  return { streak: newStreak };
}

export async function checkAndAwardBadges(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) return [];

  const currentBadges: { id: string; name: string; emoji: string; earned_at: string }[] = profile.badges || [];
  const earnedIds = new Set(currentBadges.map((b) => b.id));

  // Get solve count
  const { count: solveCount } = await supabase()
    .from("solves")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Get distinct subjects
  const { data: subjectData } = await supabase()
    .from("solves")
    .select("subject")
    .eq("user_id", userId);
  const uniqueSubjects = new Set((subjectData || []).map((s: any) => s.subject));

  // Get avg score
  const { data: allSolves } = await supabase()
    .from("solves")
    .select("understanding_score")
    .eq("user_id", userId);
  const scores = (allSolves || []).map((s: any) => s.understanding_score || 0);
  const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
  const hasPerfect = scores.some((s: number) => s === 100);

  const streak = profile.current_streak || 0;
  const total = solveCount || 0;

  // Check conditions
  const checks: [string, boolean][] = [
    ["first_solve", total >= 1],
    ["ten_solves", total >= 10],
    ["fifty_solves", total >= 50],
    ["hundred_solves", total >= 100],
    ["streak_3", streak >= 3],
    ["streak_7", streak >= 7],
    ["streak_30", streak >= 30],
    ["perfect_score", hasPerfect],
    ["multi_subject", uniqueSubjects.size >= 3],
    ["high_scorer", scores.length >= 5 && avgScore > 90],
  ];

  // Get badge definitions
  const { data: badgeDefs } = await supabase().from("badge_definitions").select("*");
  const defMap = new Map((badgeDefs || []).map((d: any) => [d.id, d]));

  const newBadges: typeof currentBadges = [];
  let bonusXP = 0;

  for (const [id, condition] of checks) {
    if (condition && !earnedIds.has(id)) {
      const def = defMap.get(id);
      if (def) {
        newBadges.push({ id, name: def.name, emoji: def.emoji, earned_at: new Date().toISOString() });
        bonusXP += def.xp_reward || 0;
      }
    }
  }

  if (newBadges.length > 0) {
    const allBadges = [...currentBadges, ...newBadges];
    await supabase().from("profiles").update({ badges: allBadges }).eq("id", userId);
    if (bonusXP > 0) await awardXP(userId, bonusXP);
  }

  return newBadges;
}

export async function getGamificationStats(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) return { xp: 0, level: 1, streak: 0, badges: [], levelTitle: "Beginner" };
  return {
    xp: profile.xp || 0,
    level: profile.level || 1,
    streak: profile.current_streak || 0,
    longestStreak: profile.longest_streak || 0,
    badges: profile.badges || [],
    levelTitle: getLevelTitle(profile.level || 1),
  };
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

  if (error || !promo) return { valid: false, message: "That's not a Tut City promo code 😕 If you have a discount code, you'll enter it at checkout when subscribing!" };
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

// ─── Affiliates ─────────────────────────────────────────────

export async function createAffiliate(userId: string, code: string, name: string, email: string) {
  const { data, error } = await supabase()
    .from("affiliates")
    .insert({ user_id: userId, code: code.toLowerCase(), name, email })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAffiliate(code: string) {
  const { data, error } = await supabase()
    .from("affiliates")
    .select("*")
    .eq("code", code.toLowerCase())
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getAffiliateByUserId(userId: string) {
  const { data, error } = await supabase()
    .from("affiliates")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getAllAffiliates() {
  const { data, error } = await supabase()
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function trackReferral(affiliateCode: string, referredUserId: string) {
  const affiliate = await getAffiliate(affiliateCode);
  if (!affiliate || !affiliate.active) return null;

  // Check if already referred
  const { data: existing } = await supabase()
    .from("referrals")
    .select("id")
    .eq("referred_user_id", referredUserId)
    .single();
  if (existing) return null;

  const { data, error } = await supabase()
    .from("referrals")
    .insert({ affiliate_id: affiliate.id, referred_user_id: referredUserId })
    .select()
    .single();
  if (error) throw error;

  // Update affiliate total_referrals
  await supabase()
    .from("affiliates")
    .update({ total_referrals: affiliate.total_referrals + 1 })
    .eq("id", affiliate.id);

  // Mark profile as referred
  await supabase()
    .from("profiles")
    .update({ referred_by: affiliateCode })
    .eq("id", referredUserId);

  return data;
}

export async function updateReferralStatus(referredUserId: string, status: string, commissionAmount: number) {
  // Get the referral
  const { data: referral, error: refErr } = await supabase()
    .from("referrals")
    .select("*, affiliates(*)")
    .eq("referred_user_id", referredUserId)
    .single();
  if (refErr || !referral) return null;

  // Update referral
  await supabase()
    .from("referrals")
    .update({ status, commission_amount: commissionAmount })
    .eq("id", referral.id);

  // Update affiliate earnings
  if (status === "subscribed" && commissionAmount > 0) {
    const affiliate = referral.affiliates;
    await supabase()
      .from("affiliates")
      .update({
        total_earnings: (affiliate.total_earnings || 0) + commissionAmount,
        pending_earnings: (affiliate.pending_earnings || 0) + commissionAmount,
      })
      .eq("id", affiliate.id);
  }

  return referral;
}

export async function getAffiliateStats(affiliateId: string) {
  const { data: affiliate } = await supabase()
    .from("affiliates")
    .select("*")
    .eq("id", affiliateId)
    .single();

  const { data: referrals } = await supabase()
    .from("referrals")
    .select("*")
    .eq("affiliate_id", affiliateId);

  const allRefs = referrals || [];
  return {
    ...affiliate,
    referrals: allRefs,
    activeSubscribers: allRefs.filter((r: any) => r.status === "subscribed").length,
    signedUp: allRefs.filter((r: any) => r.status === "signed_up").length,
    churned: allRefs.filter((r: any) => r.status === "churned").length,
  };
}

export async function getAffiliateReferrals(affiliateId: string) {
  const { data, error } = await supabase()
    .from("referrals")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function markEarningsPaid(affiliateId: string, amount: number) {
  const { data: affiliate } = await supabase()
    .from("affiliates")
    .select("*")
    .eq("id", affiliateId)
    .single();
  if (!affiliate) throw new Error("Affiliate not found");

  const newPending = Math.max(0, (affiliate.pending_earnings || 0) - amount);
  const newPaid = (affiliate.paid_earnings || 0) + amount;

  const { error } = await supabase()
    .from("affiliates")
    .update({ pending_earnings: newPending, paid_earnings: newPaid })
    .eq("id", affiliateId);
  if (error) throw error;
}
