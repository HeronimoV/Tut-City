import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { stepInfo, question } = await req.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: `You are a kind, encouraging math tutor. The student is stuck on step ${stepInfo.stepNumber} of a problem about "${stepInfo.problem}".

The step is: "${stepInfo.action}"
Why: "${stepInfo.why}"
Result: "${stepInfo.result}"
Concept: "${stepInfo.concept}"

Give a short, encouraging hint WITHOUT giving away the answer. Use simpler language. Keep it to 2-3 sentences max. Be warm and supportive. Use an emoji or two.`,
      messages: [{ role: "user", content: question }],
    });

    const hint = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ hint });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
