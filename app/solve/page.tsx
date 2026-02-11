"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import StepWalkthrough from "@/components/StepWalkthrough";
import ChatFollowUp from "@/components/ChatFollowUp";

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
}

export default function SolvePage() {
  const { status } = useSession();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const handleImageCapture = async (imageData: string) => {
    // Check trial/access
    const isPaid = localStorage.getItem("tut_city_access") === "true";
    const solves = parseInt(localStorage.getItem("tut_city_solves") || "0", 10);
    if (!isPaid && solves >= 3) {
      setError("Free trial used up! Subscribe for unlimited access 🎟️");
      return;
    }

    setImage(imageData);
    setError(null);
    setSolving(true);
    setResult(null);
    setShowChat(false);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      if (!res.ok) throw new Error("Failed to solve. Try again!");
      const data = await res.json();
      setResult(data);

      // Increment solve count
      if (!isPaid) {
        localStorage.setItem("tut_city_solves", String(solves + 1));
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setSolving(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setShowChat(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="gradient-bg px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-white text-2xl">
          ←
        </button>
        <h1 className="text-white font-bold text-lg">Solve a Problem</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {!image && !result && <CameraCapture onCapture={handleImageCapture} />}

        {solving && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 animate-float">🧠</div>
            <p className="text-violet-600 font-semibold text-lg">Analyzing your problem...</p>
            <p className="text-gray-400 text-sm mt-2">This usually takes a few seconds</p>
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
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={handleReset}
              className="mt-3 text-red-500 underline text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {result && !showChat && (
          <div>
            {image && (
              <div className="mb-4 rounded-2xl overflow-hidden">
                <img src={image} alt="Problem" className="w-full max-h-48 object-cover" />
              </div>
            )}
            <StepWalkthrough result={result} onComplete={() => setShowChat(true)} />
            <button
              onClick={handleReset}
              className="w-full mt-4 py-3 text-violet-500 font-semibold text-sm hover:text-violet-700 transition"
            >
              ← Solve another problem
            </button>
          </div>
        )}

        {showChat && result && (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 text-center">
              <p className="text-green-700 font-semibold">✅ Answer: {result.answer}</p>
              <p className="text-green-600 text-sm mt-1">Concept: {result.concept}</p>
            </div>
            <ChatFollowUp problem={result} />
            <button
              onClick={handleReset}
              className="w-full mt-4 py-3 text-violet-500 font-semibold text-sm"
            >
              ← Solve another problem
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
