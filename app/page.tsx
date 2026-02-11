"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-lg mx-auto px-6 py-12 flex flex-col min-h-screen">
        {/* Header */}
        <div className="text-center pt-8 pb-12">
          <div className="text-6xl mb-4 animate-float">🏙️📐</div>
          <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">
            Tut City
          </h1>
          <p className="text-xl text-white/80 font-medium">
            Your geometry BFF ✨
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-10">
          {[
            { emoji: "📸", title: "Snap a pic", desc: "Take a photo of any geometry problem" },
            { emoji: "🧠", title: "Step-by-step", desc: "Get clear explanations for every step" },
            { emoji: "💬", title: "Ask follow-ups", desc: "Chat about anything you don't get" },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-3xl">{f.emoji}</span>
              <div>
                <h3 className="text-white font-bold text-lg">{f.title}</h3>
                <p className="text-white/70 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-auto space-y-3 pb-8">
          <button
            onClick={() => signIn("google")}
            className="w-full bg-white text-violet-600 font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            Continue with Google 🚀
          </button>
          <button
            onClick={() => signIn("credentials")}
            className="w-full bg-white/15 backdrop-blur-sm text-white font-semibold text-lg py-4 rounded-2xl border border-white/30 hover:bg-white/25 transition-all active:scale-[0.98]"
          >
            Sign in with Email ✉️
          </button>
          <p className="text-center text-white/50 text-xs mt-4">
            Free trial included • $34.99/mo after • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
