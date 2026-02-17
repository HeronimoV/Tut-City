"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PaywallGate from "@/components/PaywallGate";
import PromoCodeInput from "@/components/PromoCodeInput";

const quotes = [
  "Math is not about numbers, equations, or algorithms: it is about understanding. 🧠",
  "The only way to learn mathematics is to do mathematics. 💪",
  "Every expert was once a beginner. Keep going! 🌟",
  "Mistakes are proof that you are trying. 🎯",
  "Small daily improvements lead to stunning results. 📈",
  "You don't have to be great to start, but you have to start to be great. 🚀",
  "Practice isn't the thing you do once you're good. It's the thing you do that makes you good. ✨",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return quotes[day % quotes.length];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [trialRemaining, setTrialRemaining] = useState(3);
  const [isPaid, setIsPaid] = useState(false);
  const [totalSolves, setTotalSolves] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recentSolves, setRecentSolves] = useState<{ subject: string; concept: string; score: number; date: string }[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/access")
      .then((r) => r.json())
      .then((data) => {
        setIsPaid(data.reason === "paid");
        setTrialRemaining(data.trialRemaining ?? 0);
        setHasAccess(data.hasAccess ?? false);
        setTotalSolves(data.totalSolves ?? 0);
        setChecking(false);
      })
      .catch(() => {
        setHasAccess(true);
        setChecking(false);
      });

    // Fetch progress for streak and recent solves
    fetch("/api/progress")
      .then((r) => r.json())
      .then((data) => {
        setStreak(data.streak ?? 0);
        setRecentSolves((data.recentSolves ?? []).slice(0, 3));
      })
      .catch(() => {});
  }, [status]);

  const onTrial = !isPaid && trialRemaining > 0;

  const grantAccess = () => {
    setHasAccess(true);
    setIsPaid(true);
  };

  if (status === "loading" || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-violet-500 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold gradient-text">Tut City 🏙️</h1>
            <p className="text-gray-500 mt-2">Unlock unlimited geometry help!</p>
          </div>
          <PaywallGate onSubscribed={grantAccess} />
          <div className="mt-6">
            <PromoCodeInput onSuccess={grantAccess} />
          </div>
        </div>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="gradient-bg px-4 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Tut City 🏙️</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/progress")}
            className="text-white/80 text-sm hover:text-white transition"
          >
            📊 Progress
          </button>
          <button
            onClick={() => router.push("/affiliate")}
            className="text-white/80 text-sm hover:text-white transition"
          >
            🤝 Affiliate
          </button>
          <button
            onClick={() => signOut()}
            className="text-white/70 text-sm hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {getGreeting()}, {firstName}! 👋
          </h2>
          <p className="text-gray-500 mt-1">Ready to crush some math?</p>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-4 text-center animate-slide-up">
            <span className="text-orange-600 font-bold text-sm">🔥 {streak}-day streak! Keep it going!</span>
          </div>
        )}

        {/* Daily quote */}
        <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 rounded-2xl p-4 mb-4">
          <p className="text-violet-700 text-sm font-medium italic">
            💡 {getDailyQuote()}
          </p>
        </div>

        {/* Mini stats */}
        {totalSolves > 0 && (
          <button
            onClick={() => router.push("/progress")}
            className="w-full bg-violet-50 border border-violet-100 rounded-2xl p-3 mb-4 text-center hover:bg-violet-100 transition"
          >
            <span className="text-violet-700 text-sm font-semibold">
              📊 {totalSolves} problem{totalSolves !== 1 ? "s" : ""} solved — View Progress →
            </span>
          </button>
        )}

        {/* Main action */}
        <button
          onClick={() => router.push("/solve")}
          className="w-full gradient-bg text-white font-bold text-xl py-6 rounded-3xl shadow-lg hover:shadow-xl hover-lift active:scale-[0.98] mb-6"
        >
          📸 Solve a Problem
        </button>

        {/* Recently solved */}
        {recentSolves.length > 0 && (
          <div className="bg-white rounded-2xl p-4 card-shadow mb-6">
            <h3 className="font-bold text-gray-700 text-sm mb-3">🕐 Recently solved</h3>
            <div className="space-y-2">
              {recentSolves.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{s.subject} · {s.concept}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    s.score >= 80 ? "bg-green-50 text-green-600" : s.score >= 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                  }`}>
                    {s.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subjects */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: "➕", name: "Arithmetic" },
            { emoji: "🍕", name: "Fractions" },
            { emoji: "🎒", name: "Elementary" },
            { emoji: "📐", name: "Geometry" },
            { emoji: "🔢", name: "Algebra" },
            { emoji: "📊", name: "Trig" },
            { emoji: "📈", name: "Pre-Calc" },
            { emoji: "∫", name: "Calculus" },
            { emoji: "📉", name: "Statistics" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 card-shadow text-center hover-glow border border-transparent cursor-default">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <div className="text-xs text-gray-500 font-medium">{s.name}</div>
            </div>
          ))}
        </div>

        {/* Trial banner */}
        {onTrial && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-amber-700 text-sm font-semibold">
              🎟️ Free Trial: {trialRemaining} solve{trialRemaining !== 1 ? "s" : ""} remaining
            </p>
            <p className="text-amber-600 text-xs mt-1">Subscribe for unlimited access!</p>
          </div>
        )}
      </div>
    </div>
  );
}
