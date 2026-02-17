"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

function ScrollSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  return (
    <div ref={ref} className={`fade-in-up ${isVisible ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollAnimation(0.3);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className="text-3xl font-extrabold text-white">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-white font-semibold text-sm pr-4">{q}</span>
        <span className={`text-white/60 text-xl transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      <div className={`faq-content ${open ? "open" : ""}`}>
        <p className="text-white/60 text-sm pb-4">{a}</p>
      </div>
    </div>
  );
}

function SparkleBackground() {
  const sparkles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    size: Math.random() * 3 + 2,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="sparkle"
          style={{ left: s.left, top: s.top, animationDelay: s.delay, width: s.size, height: s.size }}
        />
      ))}
    </div>
  );
}

function LandingPageInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Store referral code from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("tut_ref", ref);
  }, [searchParams]);

  useEffect(() => {
    if (session) {
      const ref = localStorage.getItem("tut_ref");
      if (ref) {
        fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: ref }),
        }).finally(() => localStorage.removeItem("tut_ref"));
      }
      router.push("/dashboard");
    }
  }, [session, router]);

  // Show floating CTA after scrolling past hero
  useEffect(() => {
    const handleScroll = () => setShowFloatingCta(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSignup = useCallback(() => {
    document.getElementById("signup-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError("Invalid email or password 😕");
    else if (result?.ok) router.push("/dashboard");
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
      {/* ===== HERO ===== */}
      <div ref={heroRef} className="relative max-w-lg mx-auto px-6 pt-16 pb-12 text-center">
        <SparkleBackground />
        <div className="relative z-10">
          <div className="text-6xl mb-4 animate-float">🏙️📐</div>
          <h1 className="text-5xl font-extrabold shimmer-text mb-3 tracking-tight">
            Tut City
          </h1>
          <p className="text-xl text-white/80 font-medium mb-2">
            Your math BFF ✨
          </p>
          <p className="text-white/60 text-sm max-w-xs mx-auto">
            Snap a photo of any math problem. Get step-by-step help that actually makes sense.
          </p>
          <button
            onClick={scrollToSignup}
            className="mt-8 bg-white text-violet-600 font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover-lift active:scale-[0.98]"
          >
            Try Free → 
          </button>
          <p className="text-white/40 text-xs mt-3">3 free solves • No credit card needed</p>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <ScrollSection className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-2xl font-extrabold text-white text-center mb-8">How it works</h2>
        <div className="space-y-4">
          {[
            { num: "1", emoji: "📸", title: "Snap a photo", desc: "Take a pic of any math problem — homework, textbook, whiteboard" },
            { num: "2", emoji: "🧠", title: "AI breaks it down", desc: "Get clear step-by-step explanations with comprehension checks" },
            { num: "3", emoji: "🎓", title: "You actually learn", desc: "Not just answers — real understanding you can take to the test" },
          ].map((s, i) => (
            <div key={i} className="glass-card p-5 flex items-start gap-4 hover-lift">
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                {s.num}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  {s.emoji} {s.title}
                </h3>
                <p className="text-white/60 text-sm mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollSection>

      {/* ===== SEE IT IN ACTION ===== */}
      <ScrollSection className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-2xl font-extrabold text-white text-center mb-2">See it in action</h2>
        <p className="text-white/50 text-center text-sm mb-8">Here&apos;s what solving a problem looks like</p>
        <div className="space-y-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-violet-500/30 text-white text-xs font-bold px-2 py-1 rounded-full">Step 1</span>
              <span className="text-white/50 text-xs">Identify what we know</span>
            </div>
            <p className="text-white/80 text-sm">We have a right triangle with legs of 3 and 4. We need to find the hypotenuse.</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-violet-500/30 text-white text-xs font-bold px-2 py-1 rounded-full">Step 2</span>
              <span className="text-white/50 text-xs">Apply the formula</span>
            </div>
            <p className="text-white/80 text-sm">Using the Pythagorean theorem: a² + b² = c²</p>
            <div className="bg-blue-500/15 rounded-lg p-2 mt-2">
              <p className="text-blue-200 text-xs">💡 <strong>Why?</strong> This works for ALL right triangles!</p>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-500/30 text-white text-xs font-bold px-2 py-1 rounded-full">🧠 Check</span>
            </div>
            <p className="text-white/80 text-sm mb-2">What is 3² + 4²?</p>
            <div className="flex gap-2">
              <span className="bg-white/10 text-white/60 text-xs px-3 py-1.5 rounded-lg">A. 12</span>
              <span className="bg-green-500/30 text-green-200 text-xs px-3 py-1.5 rounded-lg border border-green-400/30">B. 25 ✓</span>
              <span className="bg-white/10 text-white/60 text-xs px-3 py-1.5 rounded-lg">C. 7</span>
            </div>
          </div>
          <div className="glass-card p-4 border-green-400/20">
            <p className="text-green-300 font-bold text-center">✅ Answer: c = 5</p>
            <p className="text-white/50 text-xs text-center mt-1">Understanding score: 95% 🌟</p>
          </div>
        </div>
      </ScrollSection>

      {/* ===== SOCIAL PROOF ===== */}
      <ScrollSection className="max-w-lg mx-auto px-6 py-12 text-center">
        <p className="text-white/50 text-sm uppercase tracking-wider mb-6">Trusted by students across the country</p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <AnimatedCounter target={2847} />
            <p className="text-white/50 text-xs mt-1">Problems solved</p>
          </div>
          <div>
            <AnimatedCounter target={94} suffix="%" />
            <p className="text-white/50 text-xs mt-1">Avg understanding</p>
          </div>
          <div>
            <AnimatedCounter target={312} />
            <p className="text-white/50 text-xs mt-1">Happy students</p>
          </div>
        </div>
      </ScrollSection>

      {/* ===== TESTIMONIALS ===== */}
      <ScrollSection className="max-w-lg mx-auto px-6 py-8">
        <h2 className="text-2xl font-extrabold text-white text-center mb-6">What students say</h2>
        <div className="space-y-3">
          {[
            { name: "Maya T.", grade: "8th Grade", quote: "I went from a C to a B+ in geometry in 3 weeks. The step-by-step really helps it click.", stars: 5 },
            { name: "James K.", grade: "10th Grade", quote: "Way better than just copying answers. I actually understand what I'm doing on tests now.", stars: 5 },
            { name: "Sarah P.", grade: "Parent", quote: "My daughter's confidence in math has completely turned around. Worth every penny.", stars: 5 },
          ].map((t, i) => (
            <div key={i} className="glass-card p-5 hover-lift">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <span key={j} className="text-yellow-400 text-sm">⭐</span>
                ))}
              </div>
              <p className="text-white/80 text-sm italic mb-3">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.grade}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollSection>

      {/* ===== SUBJECTS ===== */}
      <ScrollSection className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-2xl font-extrabold text-white text-center mb-2">All subjects. All grades.</h2>
        <p className="text-white/50 text-center text-sm mb-6">Grades 1 through 12 — we&apos;ve got you covered</p>
        <div className="grid grid-cols-3 gap-2">
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
            <div key={i} className="glass-card p-3 text-center hover-lift">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <div className="text-xs text-white/60 font-medium">{s.name}</div>
            </div>
          ))}
        </div>
      </ScrollSection>

      {/* ===== FAQ ===== */}
      <ScrollSection className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-2xl font-extrabold text-white text-center mb-6">Got questions?</h2>
        <div className="glass-card p-5">
          <FAQItem q="What grades does Tut City cover?" a="Grades 1 through 12! From basic arithmetic to calculus and statistics. If it's math, we can help." />
          <FAQItem q="How does it actually work?" a="Just take a photo of any math problem. Our AI analyzes it, breaks it into steps, tests your understanding along the way, and lets you ask follow-up questions." />
          <FAQItem q="Is it just giving answers?" a="Nope! Tut City is designed to teach, not cheat. You go through each step with comprehension checks so you actually learn the material." />
          <FAQItem q="Can I cancel anytime?" a="Absolutely. Cancel anytime from your account — no questions asked, no hidden fees." />
          <FAQItem q="How much does it cost?" a="3 free solves to try it out, then $39.99/month for unlimited access. That's about $1.33/day — less than a coffee ☕" />
        </div>
      </ScrollSection>

      {/* ===== SIGN UP SECTION ===== */}
      <div id="signup-section" className="max-w-lg mx-auto px-6 py-12">
        <ScrollSection>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-white mb-2">Ready to actually get math?</h2>
            <p className="text-white/50 text-sm">Start with 3 free solves. No credit card needed.</p>
          </div>

          <div className="space-y-3 pb-8">
            {!showEmailForm ? (
              <>
                {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
                  <button
                    onClick={() => signIn("google")}
                    className="w-full bg-white text-violet-600 font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl hover-lift active:scale-[0.98]"
                  >
                    Continue with Google 🚀
                  </button>
                )}
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full bg-white text-violet-600 font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl hover-lift active:scale-[0.98]"
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
                {error && <p className="text-red-300 text-sm text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-violet-600 font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl hover-lift active:scale-[0.98] disabled:opacity-50"
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
              3 free solves • Then $39.99/mo • Cancel anytime
            </p>
          </div>
        </ScrollSection>
      </div>

      {/* ===== FLOATING CTA ===== */}
      {showFloatingCta && (
        <div className="floating-cta">
          <button
            onClick={scrollToSignup}
            className="bg-white text-violet-600 font-bold text-sm px-6 py-3 rounded-full shadow-xl hover:shadow-2xl active:scale-[0.98]"
          >
            Try Free →
          </button>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center"><div className="text-white text-2xl animate-pulse">Loading...</div></div>}>
      <LandingPageInner />
    </Suspense>
  );
}
