"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StepWalkthrough from "@/components/StepWalkthrough";
import ChatFollowUp from "@/components/ChatFollowUp";
import Confetti from "@/components/Confetti";
import StuckButton from "@/components/StuckButton";

interface SolveResult {
  problem: string;
  given: string[];
  steps: { step: number; action: string; why: string; result: string; comprehensionCheck?: any }[];
  answer: string;
  concept: string;
  subject?: string;
  subjectName?: string;
  subjectEmoji?: string;
}

const SUBJECTS = [
  { id: "Arithmetic", emoji: "➕" },
  { id: "Fractions", emoji: "🍕" },
  { id: "Algebra", emoji: "🔢" },
  { id: "Geometry", emoji: "📐" },
  { id: "Trigonometry", emoji: "📊" },
  { id: "Pre-Calculus", emoji: "📈" },
  { id: "Calculus", emoji: "∫" },
  { id: "Statistics", emoji: "📉" },
];

export default function PracticePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [weaknesses, setWeaknesses] = useState<{ subject: string; concept: string; recommendation: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [solveStartTime, setSolveStartTime] = useState(0);
  const [currentStepInfo, setCurrentStepInfo] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/progress")
      .then((r) => r.json())
      .then((data) => {
        // Extract weak concepts from conceptScores
        const weak = (data.conceptScores || [])
          .filter((c: any) => c.attempts >= 2 && c.correct_first_try / c.attempts < 0.6)
          .map((c: any) => ({
            subject: c.subject,
            concept: c.concept,
            recommendation: `${Math.round((c.correct_first_try / c.attempts) * 100)}% accuracy`,
          }));
        setWeaknesses(weak);
      })
      .catch(() => {});
  }, [status]);

  const generateProblem = async (subject: string, concept?: string) => {
    setGenerating(true);
    setResult(null);
    setShowChat(false);
    setSolveStartTime(Date.now());

    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, concept }),
      });
      if (!res.ok) throw new Error("Failed to generate problem");
      const data = await res.json();
      setResult(data);
    } catch {
      alert("Failed to generate problem. Try again!");
    } finally {
      setGenerating(false);
    }
  };

  const handleSolveComplete = async (score: number, comprehensionResults: Record<string, boolean>, stepTimes: Record<string, number>) => {
    if (score >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
    setShowChat(true);
    setCurrentStepInfo(null);
    if (!result) return;
    const timeSpent = Math.round((Date.now() - solveStartTime) / 1000);
    try {
      await fetch("/api/solves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: result.subjectName || result.subject || "General",
          problem_description: result.problem,
          answer: result.answer,
          concept: result.concept,
          steps: result.steps,
          understanding_score: score,
          comprehension_results: comprehensionResults,
          time_spent_seconds: timeSpent,
        }),
      });
      // Update local solve count for notification prompt
      const count = parseInt(localStorage.getItem("total-solves-count") || "0", 10);
      localStorage.setItem("total-solves-count", String(count + 1));
    } catch {}
  };

  const handleReset = () => {
    setResult(null);
    setShowChat(false);
    setCurrentStepInfo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Confetti active={showConfetti} />

      {/* Top bar */}
      <div className="gradient-bg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="text-white text-2xl">←</button>
          <h1 className="text-white font-bold text-lg">📝 Practice Mode</h1>
        </div>
        <button onClick={() => router.push("/solve")} className="text-white/80 text-sm hover:text-white transition">
          📸 Solve
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {!result && !generating && (
          <>
            {/* Weak areas */}
            {weaknesses.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-700 text-sm mb-3">🎯 Areas to improve</h3>
                <div className="space-y-2">
                  {weaknesses.map((w, i) => (
                    <button
                      key={i}
                      onClick={() => generateProblem(w.subject, w.concept)}
                      className="w-full bg-white rounded-2xl p-4 card-shadow text-left hover:border-violet-300 border border-transparent transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-gray-800 text-sm">{w.subject} · {w.concept}</span>
                          <p className="text-gray-400 text-xs mt-0.5">{w.recommendation}</p>
                        </div>
                        <span className="text-violet-500 font-bold text-sm">Practice →</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All subjects */}
            <h3 className="font-bold text-gray-700 text-sm mb-3">📚 Practice by subject</h3>
            <div className="grid grid-cols-2 gap-3">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => generateProblem(s.id)}
                  className="bg-white rounded-2xl p-4 card-shadow text-center hover:border-violet-300 border border-transparent transition hover-lift"
                >
                  <div className="text-3xl mb-2">{s.emoji}</div>
                  <div className="text-sm font-semibold text-gray-700">{s.id}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {generating && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 animate-bounce">📝</div>
            <p className="text-violet-600 font-semibold">Generating a practice problem...</p>
            <div className="mt-4 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        {result && !showChat && (
          <div className="animate-slide-up">
            <div className="flex justify-center mb-4">
              <div className="bg-violet-50 rounded-full px-4 py-2 inline-flex items-center gap-2">
                <span>📝</span>
                <span className="text-violet-700 text-sm font-semibold">Practice Problem</span>
              </div>
            </div>
            <StepWalkthrough result={result} onComplete={handleSolveComplete} />
            <button onClick={handleReset} className="w-full mt-4 py-3 text-violet-500 font-semibold text-sm hover:text-violet-700 transition">
              ← Try another problem
            </button>
          </div>
        )}

        {showChat && result && (
          <div className="animate-slide-up">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 text-center">
              <p className="text-green-700 font-semibold">✅ Answer: {result.answer}</p>
              <p className="text-green-600 text-sm mt-1">Concept: {result.concept}</p>
            </div>
            <ChatFollowUp problem={result} />
            <button onClick={handleReset} className="w-full mt-4 py-3 text-violet-500 font-semibold text-sm">
              ← Try another problem
            </button>
          </div>
        )}
      </div>

      {result && !showChat && (
        <StuckButton stepInfo={currentStepInfo} />
      )}
    </div>
  );
}
