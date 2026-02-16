import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { updateReferralStatus } from "@/lib/db";
import { createServerClient } from "@/lib/supabase";

const SUBSCRIPTION_PRICE = 39.99;
const DEFAULT_COMMISSION_RATE = 0.15;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const email = session.customer_email;
        console.log(`✅ Subscription created for ${email}`);

        // Check if this user was referred and attribute commission
        if (email) {
          try {
            const supabase = createServerClient();
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, referred_by")
              .eq("email", email)
              .single();

            if (profile?.referred_by) {
              const commission = Math.round(SUBSCRIPTION_PRICE * DEFAULT_COMMISSION_RATE * 100) / 100;
              await updateReferralStatus(profile.id, "subscribed", commission);
              console.log(`💰 Affiliate commission: $${commission} for ref code ${profile.referred_by}`);
            }
          } catch (e) {
            console.error("Affiliate tracking error:", e);
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        console.log(`❌ Subscription cancelled: ${sub.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
