import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

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
        console.log(`✅ Subscription created for ${session.customer_email}`);
        // In production: update user record in database
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        console.log(`❌ Subscription cancelled: ${sub.id}`);
        // In production: revoke access in database
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
