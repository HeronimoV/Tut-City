"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PaywallGate from "@/components/PaywallGate";
import PromoCodeInput from "@/components/PromoCodeInput";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [trialRemaining, setTrialRemaining] = useState(3);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    const access = localStorage.getItem("tut_city_access") === "true";
    const solveCount = parseInt(localStorage.getItem("tut_city_solves") || "0", 10);
    const remaining = Math.max(0, 3 - solveCount);
    setIsPaid(access);
    setTrialRemaining(remaining);
    if (access || remaining > 0) setHasAccess(true);
    setChecking(false);
  }, []);

  const onTrial = !isPaid && trialRemaining > 0;

  const grantAccess = () => {
    localStorage.setItem("tut_city_access", "true");
    setHasAccess(true);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="gradient-bg px-4 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Tut City 🏙️</h1>
        <button
          onClick={() => signOut()}
          className="text-white/70 text-sm hover:text-white transition"
        >
          Sign out
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Hey {session?.user?.name?.split(" ")[0] || "there"}! 👋
          </h2>
          <p className="text-gray-500 mt-1">Ready to crush some geometry?</p>
        </div>

        {/* Main action */}
        <button
          onClick={() => router.push("/solve")}
          className="w-full gradient-bg text-white font-bold text-xl py-6 rounded-3xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] mb-6"
        >
          📸 Solve a Problem
        </button>

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
            <div key={i} className="bg-white rounded-2xl p-3 card-shadow text-center">
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

        {/* Recent tip */}
        <div className="mt-6 bg-violet-50 border border-violet-100 rounded-2xl p-4">
          <p className="text-violet-700 text-sm font-medium">
            💡 Pro tip: Make sure the whole problem is visible in the photo for best results!
          </p>
        </div>
      </div>
    </div>
  );
}
