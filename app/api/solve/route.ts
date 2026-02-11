import { NextRequest, NextResponse } from "next/server";
import { solveGeometryProblem } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });
    const result = await solveGeometryProblem(image);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Solve error:", error);
    return NextResponse.json({ error: error.message || "Failed to solve" }, { status: 500 });
  }
}
