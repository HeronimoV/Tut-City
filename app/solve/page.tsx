"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import StepWalkthrough from "@/components/StepWalkthrough";
import ChatFollowUp from "@/components/ChatFollowUp";
import Confetti from "@/components/Confetti";
import StuckButton from "@/components/StuckButton";

interface ComprehensionCheck {
  question: string;
  options: string[];
  correctIndex: number;
}

interface SolveResult {
  problem: string;
  given: string[];
  steps: { step: number; action: string; why: string; result: string; comprehensionCheck?: ComprehensionCheck | null }[];
  answer: string;
  concept: string;
  subject?: string;
  subjectName?: string;
  subjectEmoji?: string;
}

function BrainLoader() {
  const symbols = ["π", "∑", "√", "÷", "×", "∞", "±", "∫"];
  return (
    <div className="text-center py-16">
      <div className="relative inline-block">
        <div className="text-5xl brain-pulse">🧠</div>
        {symbols.map((s, i) => (
          <span
            key={i}
            className="symbol-float text-white/60"
            style={{
              left: `${50 + 40 * Math.cos((i / symbols.length) * Math.PI * 2)}%`,
              top: `${50 + 40 * Math.sin((i / symbols.length) * Math.PI * 2)}%`,
              animationDelay: `${i * 0.25}s`,
            }}
          >
            {s}
          </span>
        ))}
      </div>
      <p className="text-violet-600 font-semibold text-lg mt-6">Analyzing your problem...</p>
      <p className="text-gray-400 text-sm mt-2">Breaking it down step by step</p>
      <div className="mt-6 flex justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-violet-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SolvePage() {
  const { status } = useSession();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [solveStartTime, setSolveStartTime] = useState<number>(0);
  const [teachingMethod, setTeachingMethod] = useState<string>("auto");
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStepInfo, setCurrentStepInfo] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const handleImageCapture = async (imageData: string) => {
    try {
      const accessRes = await fetch("/api/access");
      const accessData = await accessRes.json();
      if (!accessData.hasAccess) {
        setError("Free trial used up! Subscribe for unlimited access 🎟️");
        return;
      }
    } catch {}

    setImage(imageData);
    setError(null);
    setSolving(true);
    setSolveStartTime(Date.now());
    setResult(null);
    setShowChat(false);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, teachingMethod }),
      });
      if (!res.ok) throw new Error("Failed to solve. Try again!");
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setSolving(false);
    }
  };

  const handleSolveComplete = async (score: number, comprehensionResults: Record<string, boolean>, stepTimes: Record<string, number>) => {
    // Trigger confetti for high scores
    if (score >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
    setShowChat(true);
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
    setImage(null);
    setResult(null);
    setError(null);
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
          <h1 className="text-white font-bold text-lg">Solve a Problem</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/practice")} className="text-white/80 text-sm hover:text-white transition">
            📝 Practice
          </button>
          <button onClick={() => router.push("/progress")} className="text-white/80 text-sm hover:text-white transition">
            📊 Progress
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {!image && !result && (
          <>
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-500 mb-2 text-center">Teaching Method</h3>
              <div className="flex gap-2">
                {[
                  { id: "auto", label: "Auto", desc: "Let AI decide" },
                  { id: "common-core", label: "Common Core", desc: "Standards-based" },
                  { id: "singapore", label: "Singapore", desc: "Visual & models" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setTeachingMethod(m.id)}
                    className={`flex-1 p-3 rounded-xl text-center transition-all ${
                      teachingMethod === m.id
                        ? "bg-violet-100 border-2 border-violet-400 shadow-sm"
                        : "bg-white border border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    <div className={`text-sm font-bold ${teachingMethod === m.id ? "text-violet-700" : "text-gray-700"}`}>{m.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <CameraCapture onCapture={handleImageCapture} />
          </>
        )}

        {solving && <BrainLoader />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center animate-slide-up">
            <p className="text-red-600 font-medium">{error}</p>
            <button onClick={handleReset} className="mt-3 text-red-500 underline text-sm">Try again</button>
          </div>
        )}

        {result && !showChat && (
          <div className="animate-slide-up">
            {result.subjectEmoji && result.subjectName && (
              <div className="flex justify-center mb-4">
                <div className="bg-violet-50 rounded-full px-4 py-2 inline-flex items-center gap-2">
                  <span>{result.subjectEmoji}</span>
                  <span className="text-violet-700 text-sm font-semibold">{result.subjectName} Tutor</span>
                </div>
              </div>
            )}
            {image && (
              <div className="mb-4 rounded-2xl overflow-hidden">
                <img src={image} alt="Problem" className="w-full max-h-48 object-cover" />
              </div>
            )}
            <StepWalkthrough result={result} onComplete={handleSolveComplete} />
            <button onClick={handleReset} className="w-full mt-4 py-3 text-violet-500 font-semibold text-sm hover:text-violet-700 transition">
              ← Solve another problem
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
              ← Solve another problem
            </button>
          </div>
        )}
      </div>

      {/* Stuck button during walkthrough */}
      {result && !showChat && (
        <StuckButton stepInfo={currentStepInfo} />
      )}
    </div>
  );
}
