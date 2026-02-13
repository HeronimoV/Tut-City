import { NextRequest, NextResponse } from "next/server";
import { solveMathProblem } from "@/lib/anthropic";

export const maxDuration = 30; // Allow up to 30s for Claude to respond

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, teachingMethod } = body;
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
