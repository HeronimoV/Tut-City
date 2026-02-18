import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subject, concept } = await req.json();
    if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });

    const conceptNote = concept ? ` Focus on the concept: ${concept}.` : "";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `You are a patient, encouraging math tutor. Generate a practice problem for a student.

Generate a ${subject} practice problem appropriate for a high school student.${conceptNote} Make it challenging but solvable.

Return your response as JSON only (no markdown, no code fences):
{
  "problem": "the problem statement",
  "given": ["list", "of", "given information"],
  "steps": [
    {
      "step": 1,
      "action": "what to do",
      "why": "why we do this",
      "result": "what we get",
      "comprehensionCheck": null
    },
    {
      "step": 2,
      "action": "what to do",
      "why": "why we do this",
      "result": "what we get",
      "comprehensionCheck": {
        "question": "Quick check question",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 0
      }
    }
  ],
  "answer": "final answer",
  "concept": "key concept used"
}

Include comprehensionCheck on every 2nd-3rd step. Set to null for other steps.`,
      messages: [
        {
          role: "user",
          content: `Generate a ${subject} practice problem${conceptNote}. Return JSON only.`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse practice problem");

    const result = JSON.parse(jsonMatch[0]);
    result.subject = subject;
    result.subjectName = subject;
    result.subjectEmoji = "📝";
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
