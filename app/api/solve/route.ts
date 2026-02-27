import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAccess, incrementFreeSolves, createProfile, getProfile } from "@/lib/db";
import { solveMathProblem } from "@/lib/anthropic";

export const maxDuration = 30; // Allow up to 30s for Claude to respond

export async function POST(req: NextRequest) {
  try {
    // Parse body first (can only read once)
    const body = await req.json();
    const { image, teachingMethod } = body;

    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Ensure profile exists
    const profile = await getProfile(userId);
    if (!profile) {
      await createProfile(userId, session.user.email || "", session.user.name || "");
    }

    // Access check — enforce paywall at the API level
    const access = await checkAccess(userId);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "Free trial used up! Subscribe for unlimited access 🎟️" },
        { status: 403 }
      );
    }

    // Increment free solve counter BEFORE solving (so it always counts)
    if (access.reason === "trial") {
      await incrementFreeSolves(userId);
    }

    // Rate limit: max 20 solves per hour per user
    const now = Date.now();
    if (!(global as any)._rateLimits) (global as any)._rateLimits = {};
    const userLimits = (global as any)._rateLimits[userId] || [];
    const recentSolves = userLimits.filter((t: number) => now - t < 3600000);
    if (recentSolves.length >= 20) {
      return NextResponse.json(
        { error: "Slow down! You're solving too fast. Try again in a bit 🐢" },
        { status: 429 }
      );
    }
    (global as any)._rateLimits[userId] = [...recentSolves, now];
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // Check image size (base64 string length)
    if (image.length > 5_000_000) {
      return NextResponse.json(
        { error: "Image too large! Try taking a closer photo or uploading a smaller image." },
        { status: 400 }
      );
    }

    const result = await solveMathProblem(image, teachingMethod);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Solve error:", error?.message, error?.status);

    if (error?.status === 401 || error?.message?.includes("auth")) {
      return NextResponse.json({ error: "API key issue — contact support" }, { status: 500 });
    }
    if (error?.message?.includes("Could not parse")) {
      return NextResponse.json(
        { error: "Couldn't read that problem clearly. Try a clearer photo with good lighting! 📸" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Something went wrong. Try again!" },
      { status: 500 }
    );
  }
}
