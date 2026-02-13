import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SUBJECT_PROMPTS: Record<string, { name: string; emoji: string; prompt: string }> = {
  arithmetic: {
    name: "Arithmetic",
    emoji: "➕",
    prompt: `You are a super friendly, patient, and encouraging math tutor helping an elementary school student (ages 5-10). Cover addition, subtraction, multiplication, division, place value, and basic number sense. Use VERY simple language — imagine explaining to a 7 year old. Use fun examples (pizza slices, candy, toys). Be extra encouraging and celebratory! Use lots of emojis in your explanations.`,
  },
  fractions: {
    name: "Fractions & Decimals",
    emoji: "🍕",
    prompt: `You are a super friendly, patient, and encouraging math tutor helping an elementary/middle school student. Cover fractions, decimals, percentages, mixed numbers, and basic ratios. Use real-world examples kids understand (pizza slices, sharing equally, money). Use VERY simple language and be extra encouraging!`,
  },
  elementary: {
    name: "Elementary Math",
    emoji: "🎒",
    prompt: `You are a super friendly, patient, and encouraging math tutor helping an elementary school student (ages 8-12). Cover word problems, basic operations, measurements, time, money, simple patterns, and basic shapes. Use VERY simple language a young kid would understand. Be extra encouraging, fun, and use lots of examples from everyday life!`,
  },
  geometry: {
    name: "Geometry",
    emoji: "📐",
    prompt: `You are a patient, encouraging geometry tutor helping a high school student. Reference geometry theorems, postulates, and properties (Triangle Angle Sum, Pythagorean Theorem, parallel line theorems, circle theorems, etc). Use diagrams descriptions when helpful.`,
  },
  algebra: {
    name: "Algebra",
    emoji: "🔢",
    prompt: `You are a patient, encouraging algebra tutor helping a high school student. Reference algebraic properties, rules, and techniques (distributive property, combining like terms, factoring, quadratic formula, systems of equations, etc). Show each algebraic manipulation clearly.`,
  },
  trigonometry: {
    name: "Trigonometry",
    emoji: "📊",
    prompt: `You are a patient, encouraging trigonometry tutor helping a high school student. Reference trig identities, unit circle values, SOH-CAH-TOA, law of sines, law of cosines, etc. Explain angle relationships clearly.`,
  },
  precalculus: {
    name: "Pre-Calculus",
    emoji: "📈",
    prompt: `You are a patient, encouraging pre-calculus tutor helping a high school student. Cover functions, limits intro, polynomial behavior, rational functions, logarithms, exponentials, sequences and series. Bridge the gap between algebra/trig and calculus.`,
  },
  calculus: {
    name: "Calculus",
    emoji: "∫",
    prompt: `You are a patient, encouraging calculus tutor helping a high school student. Cover derivatives, integrals, limits, chain rule, product rule, u-substitution, etc. Explain the intuition behind each concept, not just the mechanics.`,
  },
  statistics: {
    name: "Statistics",
    emoji: "📉",
    prompt: `You are a patient, encouraging statistics tutor helping a high school student. Cover probability, distributions, hypothesis testing, mean/median/mode, standard deviation, z-scores, regression, etc. Use real-world examples to make concepts click.`,
  },
  general: {
    name: "Math",
    emoji: "🧮",
    prompt: `You are a patient, encouraging math tutor helping a student. Identify the math topic and grade level, then use appropriate language and techniques. If it looks like an elementary-level problem, use very simple language. If it's high school level, you can use more advanced terminology.`,
  },
};

const DETECT_PROMPT = `Look at this math problem image. What subject/level is it? Reply with ONLY one word from this list:
arithmetic, fractions, elementary, geometry, algebra, trigonometry, precalculus, calculus, statistics, general

Use "arithmetic" for basic addition/subtraction/multiplication/division.
Use "fractions" for fractions, decimals, percentages.
Use "elementary" for simple word problems, measurements, time, money aimed at young kids.

Just the one word, nothing else.`;

const TEACHING_METHODS: Record<string, string> = {
  "common-core": `Use the Common Core approach:
- Emphasize conceptual understanding over procedures
- Show multiple strategies/representations when possible
- Use number lines, arrays, area models, tape diagrams
- Focus on "why" methods work, not just "how"
- Reference Common Core standards language (decompose, compose, place value strategies)
- Encourage mental math strategies`,
  "singapore": `Use the Singapore Math approach:
- Use the Concrete → Pictorial → Abstract (CPA) progression
- Draw bar models (model drawing) to visualize the problem
- Emphasize number bonds and part-whole relationships
- Use place value charts and branching methods
- Focus on mastery of fewer concepts with deeper understanding
- Describe any visual models step by step (e.g. "Draw a bar model with...")`,
};

function buildSolvePrompt(subject: string, teachingMethod?: string): string {
  const tutor = SUBJECT_PROMPTS[subject] || SUBJECT_PROMPTS.general;
  const methodNote = teachingMethod && TEACHING_METHODS[teachingMethod]
    ? `\n\nTEACHING METHOD:\n${TEACHING_METHODS[teachingMethod]}\n`
    : "";
  return `${tutor.prompt}${methodNote}

When given a photo of a math problem:
1. First, identify what the problem is asking
2. List what information is given
3. Break the solution into clear, numbered steps
4. For EACH step, explain WHY you're doing it (reference the theorem, property, or rule)
5. Use simple language a high schooler would understand
6. Be encouraging!
7. For every 2nd or 3rd step, include a comprehension check question — a multiple choice question testing understanding of that step

Return your response as JSON only (no markdown, no code fences):
{
  "subject": "${subject}",
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
  "concept": "key ${tutor.name} concept used"
}

IMPORTANT: Include comprehensionCheck on approximately every 2nd or 3rd step (not every step). Set comprehensionCheck to null for steps without a check. Make questions test understanding of the reasoning, not just recall. Always provide exactly 4 options with one correct answer.`;
}

async function detectSubject(imageBase64: string): Promise<string> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const mediaType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            { type: "text", text: DETECT_PROMPT },
          ],
        },
      ],
    });

    const text = (response.content[0].type === "text" ? response.content[0].text : "").toLowerCase().trim();
    const subjects = Object.keys(SUBJECT_PROMPTS);
    const detected = subjects.find((s) => text.includes(s));
    return detected || "general";
  } catch {
    return "general";
  }
}

export async function solveMathProblem(imageBase64: string, teachingMethod?: string): Promise<any> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const mediaType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

  // Step 1: Detect subject
  const subject = await detectSubject(imageBase64);
  const tutor = SUBJECT_PROMPTS[subject] || SUBJECT_PROMPTS.general;

  // Step 2: Solve with subject-specific prompt
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: buildSolvePrompt(subject, teachingMethod),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Data },
          },
          {
            type: "text",
            text: "Please solve this math problem step by step. Include comprehension check questions on every 2nd-3rd step. Return JSON only.",
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse solution");

  const result = JSON.parse(jsonMatch[0]);
  // Ensure subject info is included
  result.subject = subject;
  result.subjectName = tutor.name;
  result.subjectEmoji = tutor.emoji;
  return result;
}

// Keep backward compat
export const solveGeometryProblem = solveMathProblem;

export async function chatAboutProblem(
  problem: any,
  question: string,
  history: { role: string; content: string }[]
): Promise<string> {
  const subject = problem.subject || "geometry";
  const tutor = SUBJECT_PROMPTS[subject] || SUBJECT_PROMPTS.general;

  const systemPrompt = `You are a patient, encouraging ${tutor.name} tutor. The student just solved this problem:
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

export function getSubjects() {
  return Object.entries(SUBJECT_PROMPTS).map(([key, val]) => ({
    id: key,
    name: val.name,
    emoji: val.emoji,
  }));
}
