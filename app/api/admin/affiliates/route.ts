import { NextRequest, NextResponse } from "next/server";
import { getAllAffiliates, createAffiliate, markEarningsPaid } from "@/lib/db";
import { createServerClient } from "@/lib/supabase";

function checkAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.ADMIN_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) return false;
  return true;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const affiliates = await getAllAffiliates();
  return NextResponse.json({ affiliates });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, code, name, email } = await req.json();
  const affiliate = await createAffiliate(userId || code, code, name || "", email || "");
  return NextResponse.json({ affiliate });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { affiliateId, action, amount, commission_rate, active } = await req.json();
  const supabase = createServerClient();

  if (action === "mark_paid" && amount) {
    await markEarningsPaid(affiliateId, amount);
    return NextResponse.json({ success: true });
  }

  const updates: any = {};
  if (commission_rate !== undefined) updates.commission_rate = commission_rate;
  if (active !== undefined) updates.active = active;

  if (Object.keys(updates).length > 0) {
    await supabase.from("affiliates").update(updates).eq("id", affiliateId);
  }

  return NextResponse.json({ success: true });
}
