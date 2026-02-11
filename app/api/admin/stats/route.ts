import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getAllPromoCodes } from "@/lib/promo";

export async function GET(req: NextRequest) {
  const err = verifyAdmin(req);
  if (err) return err;

  const codes = getAllPromoCodes();
  const entries = Object.values(codes);
  const totalPromos = entries.length;
  const activePromos = entries.filter((c) => c.active).length;
  const totalRedemptions = entries.reduce((sum, c) => sum + c.uses, 0);

  return NextResponse.json({
    totalPromos,
    activePromos,
    totalRedemptions,
    totalUsers: "N/A (check your auth provider)",
    revenue: "Manage in Stripe Dashboard",
  });
}
