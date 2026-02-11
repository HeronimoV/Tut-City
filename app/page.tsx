"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password 😕");
    } else if (result?.ok) {
      router.push("/dashboard");
    }
  };

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
          {!showEmailForm ? (
            <>
              {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
                <button
                  onClick={() => signIn("google")}
                  className="w-full bg-white text-violet-600 font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  Continue with Google 🚀
                </button>
              )}
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full bg-white text-violet-600 font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
              >
                Sign in with Email ✉️
              </button>
            </>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-3 animate-slide-up">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              {error && (
                <p className="text-red-300 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-violet-600 font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Let's go! 🚀"}
              </button>
              <button
                type="button"
                onClick={() => { setShowEmailForm(false); setError(""); }}
                className="w-full text-white/60 text-sm py-2 hover:text-white/80 transition-all"
              >
                ← Back
              </button>
            </form>
          )}
          <p className="text-center text-white/50 text-xs mt-4">
            Free trial included • $34.99/mo after • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
