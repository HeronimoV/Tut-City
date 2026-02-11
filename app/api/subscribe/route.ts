import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const session = await createCheckoutSession(email);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
