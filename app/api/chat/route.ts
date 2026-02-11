import { NextRequest, NextResponse } from "next/server";
import { chatAboutProblem } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const { problem, question, history } = await req.json();
    if (!problem || !question) {
      return NextResponse.json({ error: "Missing problem or question" }, { status: 400 });
    }
    const answer = await chatAboutProblem(problem, question, history || []);
    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message || "Failed to chat" }, { status: 500 });
  }
}
