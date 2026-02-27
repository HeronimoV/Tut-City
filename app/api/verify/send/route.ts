import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateCode, storeVerificationCode, isDisposableEmail } from "@/lib/email-verify";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Block disposable emails
    if (isDisposableEmail(email)) {
      return NextResponse.json({ error: "Please use a real email address, not a disposable one 😅" }, { status: 400 });
    }

    // Generate and store code
    const code = generateCode();
    await storeVerificationCode(email, code);

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Tut City <noreply@tutcity.org>",
      to: email,
      subject: "Your Tut City verification code 🏙️",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 28px; margin: 0;">🏙️📐 Tut City</h1>
            <p style="color: #6b7280; margin-top: 8px;">Your Math BFF</p>
          </div>
          <div style="background: linear-gradient(135deg, #8B5CF6, #6366F1); border-radius: 16px; padding: 30px; text-align: center; color: white;">
            <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.8;">Your verification code is:</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; margin: 16px 0;">${code}</div>
            <p style="margin: 16px 0 0 0; font-size: 12px; opacity: 0.6;">Expires in 10 minutes</p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            If you didn't request this, just ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (error: any) {
    console.error("Verify send error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
