import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const GEOMETRY_SYSTEM_PROMPT = `You are a patient, encouraging geometry tutor helping a high school student. When given a photo of a geometry problem:
1. First, identify what the problem is asking
2. List what information is given
3. Break the solution into clear, numbered steps
4. For EACH step, explain WHY you're doing it (reference the theorem, property, or rule)
5. Use simple language a 9th grader would understand
6. Be encouraging!
7. For every 2nd or 3rd step, include a comprehension check question — a multiple choice question testing understanding of that step. Make it encouraging, not punishing. The question should test whether the student understood the key concept or reasoning used in that step.

Return your response as JSON only (no markdown, no code fences):
{
  "problem": "description of what the problem is asking",
  "given": ["list", "of", "givens"],
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
        "question": "What property allows us to...",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0
      }
    }
  ],
  "answer": "final answer",
  "concept": "key geometry concept used"
}

IMPORTANT: Include comprehensionCheck on approximately every 2nd or 3rd step (not every step). Set comprehensionCheck to null for steps without a check. Make questions test understanding of the reasoning, not just recall. Always provide exactly 4 options with one correct answer.`;

export async function solveGeometryProblem(imageBase64: string): Promise<any> {
  // Strip data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const mediaType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: GEOMETRY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Data,
            },
          },
          {
            type: "text",
            text: "Please solve this geometry problem step by step. Include comprehension check questions on every 2nd-3rd step. Return JSON only.",
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  // Try to parse JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse solution");
  return JSON.parse(jsonMatch[0]);
}

export async function chatAboutProblem(
  problem: any,
  question: string,
  history: { role: string; content: string }[]
): Promise<string> {
  const systemPrompt = `You are a patient, encouraging geometry tutor. The student just solved this problem:
Problem: ${problem.problem}
Answer: ${problem.answer}
Concept: ${problem.concept}

They're asking a follow-up question. Be helpful, use simple language, and reference the specific steps when relevant. Keep answers concise and encouraging. Use emojis occasionally to keep it fun!`;

  const messages = [
    ...history.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user" as const, content: question },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
