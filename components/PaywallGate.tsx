"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

interface Props {
  onSubscribed: () => void;
}

export default function PaywallGate({ onSubscribed }: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Something went wrong. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl card-shadow p-6 text-center">
      <div className="text-5xl mb-4">✨</div>
      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Unlock Tut City</h2>
      <p className="text-gray-500 mb-1">Unlimited math help, anytime</p>
      <p className="text-violet-500 text-sm font-semibold mb-6">Cheaper than a coffee ☕ — less than $1.35/day</p>

      <div className="bg-violet-50 rounded-2xl p-5 mb-6">
        <div className="text-4xl font-extrabold gradient-text mb-1">$39.99</div>
        <div className="text-gray-500 text-sm">per month</div>
        <div className="mt-4 space-y-2.5 text-left">
          {[
            "Unlimited photo solves",
            "Step-by-step explanations",
            "Follow-up chat on every problem",
            "Fast responses powered by AI",
            "All subjects, grades 1-12",
            "Track your progress & streaks",
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="text-green-500 text-sm">✅</span>
              <span className="text-gray-600 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full gradient-bg text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl pulse-glow active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "Loading..." : "Subscribe Now 🚀"}
      </button>
      <p className="text-gray-400 text-xs mt-3">Cancel anytime • Secure payment via Stripe</p>
    </div>
  );
}
