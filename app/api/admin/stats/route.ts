import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const err = verifyAdmin(req);
  if (err) return err;

  const supabase = createServerClient();

  const [profiles, solves, promos] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("solves").select("id, subject", { count: "exact" }),
    supabase.from("promo_codes").select("*"),
  ]);

  // Solves by subject
  const solvesBySubject: Record<string, number> = {};
  for (const s of solves.data || []) {
    solvesBySubject[s.subject] = (solvesBySubject[s.subject] || 0) + 1;
  }

  const promoEntries = promos.data || [];

  return NextResponse.json({
    totalUsers: profiles.count || 0,
    totalSolves: solves.count || 0,
    totalPromos: promoEntries.length,
    activePromos: promoEntries.filter((p) => p.active).length,
    totalRedemptions: promoEntries.reduce((sum, p) => sum + p.uses, 0),
    solvesBySubject,
    revenue: "Manage in Stripe Dashboard",
  });
}
