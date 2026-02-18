"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ParentData {
  name: string;
  totalSolves: number;
  avgScore: number;
  streak: number;
  level: number;
  xp: number;
  badges: { id: string; name: string; emoji: string }[];
  totalTimeMinutes: number;
  subjects: { subject: string; count: number; avgScore: number }[];
  strengths: { subject: string; concept: string; rate: number }[];
  weaknesses: { subject: string; concept: string; weakness_score: number; recommendation: string }[];
  weeklySolves: number;
  weeklyAvgScore: number;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Beginner", 2: "Learner", 3: "Student", 4: "Scholar", 5: "Expert",
  6: "Master", 7: "Genius", 8: "Legend", 9: "Prodigy",
};

function getLevelTitle(level: number) {
  return LEVEL_TITLES[level] || "Math God";
}

export default function ParentPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ParentData | null>(null);
  const [error, setError] = useState("");

  const handleLookup = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch("/api/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Something went wrong");
        return;
      }
      setData(await res.json());
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="gradient-bg px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-white text-2xl">←</button>
        <h1 className="text-white font-bold text-lg">👨‍👩‍👧 Parent Dashboard</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Lookup */}
        <div className="bg-white rounded-2xl p-5 card-shadow mb-6">
          <h3 className="font-bold text-gray-800 mb-2">View your child&apos;s progress</h3>
          <p className="text-gray-500 text-sm mb-4">Enter their email to see how they&apos;re doing! 📊</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="child@email.com"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition"
            />
            <button
              onClick={handleLookup}
              disabled={loading}
              className="gradient-bg text-white font-bold px-6 py-3 rounded-xl transition active:scale-95 disabled:opacity-50"
            >
              {loading ? "..." : "View"}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {data && (
          <div className="space-y-4 animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-blue-500 rounded-2xl p-5 text-white text-center">
              <h2 className="text-xl font-bold">{data.name}&apos;s Progress</h2>
              <p className="text-white/80 text-sm mt-1">
                Level {data.level} — {getLevelTitle(data.level)} ⭐ {data.xp.toLocaleString()} XP
              </p>
              <p className="text-white/70 text-xs mt-2">Your child is making great progress! 🎉</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Problems Solved", value: data.totalSolves, emoji: "📚" },
                { label: "Avg Score", value: `${data.avgScore}%`, emoji: "🎯" },
                { label: "Current Streak", value: `${data.streak} days`, emoji: "🔥" },
                { label: "Time Spent", value: `${data.totalTimeMinutes} min`, emoji: "⏱️" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 card-shadow text-center">
                  <div className="text-2xl mb-1">{stat.emoji}</div>
                  <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Weekly summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <h4 className="font-bold text-blue-700 text-sm mb-2">📅 This Week</h4>
              <p className="text-blue-600 text-sm">
                {data.weeklySolves} problems solved · {data.weeklyAvgScore}% avg score
              </p>
            </div>

            {/* Subjects */}
            {data.subjects.length > 0 && (
              <div className="bg-white rounded-2xl p-4 card-shadow">
                <h4 className="font-bold text-gray-700 text-sm mb-3">📊 Subjects Studied</h4>
                <div className="space-y-2">
                  {data.subjects.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600">{s.subject}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{s.count} solved</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          s.avgScore >= 80 ? "bg-green-50 text-green-600" : s.avgScore >= 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                        }`}>
                          {s.avgScore}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {data.strengths.length > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <h4 className="font-bold text-green-700 text-sm mb-2">💪 Strengths</h4>
                <div className="space-y-1">
                  {data.strengths.slice(0, 5).map((s, i) => (
                    <p key={i} className="text-green-600 text-sm">✅ {s.subject} · {s.concept} ({s.rate}%)</p>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {data.weaknesses.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <h4 className="font-bold text-amber-700 text-sm mb-2">📈 Areas to Improve</h4>
                <div className="space-y-1">
                  {data.weaknesses.slice(0, 5).map((w, i) => (
                    <p key={i} className="text-amber-600 text-sm">{w.subject} · {w.concept}</p>
                  ))}
                </div>
                <p className="text-amber-500 text-xs mt-2">💡 Encourage them to use Practice Mode!</p>
              </div>
            )}

            {/* Badges */}
            {data.badges.length > 0 && (
              <div className="bg-white rounded-2xl p-4 card-shadow">
                <h4 className="font-bold text-gray-700 text-sm mb-3">🏅 Badges Earned</h4>
                <div className="flex flex-wrap gap-2">
                  {data.badges.map((b: any, i: number) => (
                    <span key={i} className="bg-violet-50 text-violet-700 text-sm px-3 py-1.5 rounded-full">
                      {b.emoji} {b.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
