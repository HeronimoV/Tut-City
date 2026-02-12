"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProgressData {
  totalSolves: number;
  avgScore: number;
  streak: number;
  subjectBreakdown: { subject: string; count: number; avgScore: number }[];
  recentSolves: { subject: string; concept: string; score: number; date: string }[];
  weaknesses: { subject: string; concept: string; score: number; recommendation: string }[];
  strengths: { subject: string; concept: string; rate: number }[];
}

export default function ProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => { setProgress(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-violet-500 text-xl animate-pulse">Loading progress...</div>
      </div>
    );
  }

  const scoreColor = (score: number) =>
    score >= 80 ? "text-green-600 bg-green-50 border-green-200" :
    score >= 50 ? "text-amber-600 bg-amber-50 border-amber-200" :
    "text-red-600 bg-red-50 border-red-200";

  const barColor = (score: number) =>
    score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="gradient-bg px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-white text-2xl">←</button>
        <h1 className="text-white font-bold text-lg">📊 My Progress</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 card-shadow text-center">
            <div className="text-2xl font-extrabold text-violet-600">{progress?.totalSolves || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Problems Solved</div>
          </div>
          <div className="bg-white rounded-2xl p-4 card-shadow text-center">
            <div className="text-2xl font-extrabold text-violet-600">{progress?.avgScore || 0}%</div>
            <div className="text-xs text-gray-500 mt-1">Avg Score</div>
          </div>
          <div className="bg-white rounded-2xl p-4 card-shadow text-center">
            <div className="text-2xl font-extrabold text-violet-600">🔥 {progress?.streak || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Day Streak</div>
          </div>
        </div>

        {/* Subject breakdown */}
        {progress?.subjectBreakdown && progress.subjectBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl p-5 card-shadow">
            <h3 className="font-bold text-gray-800 mb-4">📚 By Subject</h3>
            <div className="space-y-3">
              {progress.subjectBreakdown.map((s) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{s.subject}</span>
                    <span className="text-gray-500">{s.count} solved · {s.avgScore}% avg</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${barColor(s.avgScore)}`}
                      style={{ width: `${Math.max(5, s.avgScore)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {progress?.strengths && progress.strengths.length > 0 && (
          <div className="bg-white rounded-2xl p-5 card-shadow">
            <h3 className="font-bold text-gray-800 mb-3">💪 You&apos;re great at:</h3>
            <div className="flex flex-wrap gap-2">
              {progress.strengths.map((s, i) => (
                <span key={i} className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-1.5 rounded-full font-medium">
                  {s.concept} ({s.rate}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {progress?.weaknesses && progress.weaknesses.length > 0 && (
          <div className="bg-white rounded-2xl p-5 card-shadow">
            <h3 className="font-bold text-gray-800 mb-3">📚 Focus on:</h3>
            <div className="space-y-3">
              {progress.weaknesses.map((w, i) => (
                <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-600 font-semibold text-sm">{w.concept}</span>
                    <span className="text-red-400 text-xs">({w.subject})</span>
                  </div>
                  <p className="text-red-500 text-xs">{w.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {progress?.recentSolves && progress.recentSolves.length > 0 && (
          <div className="bg-white rounded-2xl p-5 card-shadow">
            <h3 className="font-bold text-gray-800 mb-3">🕐 Recent Activity</h3>
            <div className="space-y-2">
              {progress.recentSolves.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{s.subject}</span>
                    {s.concept && <span className="text-xs text-gray-400 ml-2">· {s.concept}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreColor(s.score || 0)}`}>
                      {s.score || 0}%
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {progress?.totalSolves === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-gray-700 font-bold text-lg">No problems solved yet!</h3>
            <p className="text-gray-400 mt-2">Solve your first problem to start tracking progress.</p>
            <button
              onClick={() => router.push("/solve")}
              className="mt-4 gradient-bg text-white font-bold px-6 py-3 rounded-2xl"
            >
              📸 Solve a Problem
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
