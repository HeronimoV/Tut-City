"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AffiliateData {
  id: string;
  code: string;
  name: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  active: boolean;
  activeSubscribers: number;
  signedUp: number;
  churned: number;
  referrals: Array<{
    id: string;
    referred_user_id: string;
    status: string;
    commission_amount: number;
    created_at: string;
  }>;
}

export default function AffiliatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [calcReferrals, setCalcReferrals] = useState(10);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/affiliates")
      .then((r) => r.json())
      .then((data) => { setAffiliate(data.affiliate); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  const apply = async () => {
    setApplying(true);
    setError("");
    const res = await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setApplying(false); return; }
    // Reload
    const r2 = await fetch("/api/affiliates");
    const d2 = await r2.json();
    setAffiliate(d2.affiliate);
    setApplying(false);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  const referralLink = affiliate ? `https://tutcity.org?ref=${affiliate.code}` : "";
  const commissionPerSub = Math.round(39.99 * (affiliate?.commission_rate || 0.15) * 100) / 100;

  // Not an affiliate yet — show application
  if (!affiliate) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button onClick={() => router.push("/dashboard")} className="text-white/70 text-sm mb-6 hover:text-white">← Back to Dashboard</button>
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Become an Affiliate</h1>
            <p className="text-white/70 mb-6">Earn 15% commission ($6.00) for every subscriber you refer!</p>

            <div className="bg-white/10 rounded-2xl p-5 mb-6 text-left">
              <h3 className="text-white font-bold mb-3">How it works:</h3>
              <div className="space-y-2 text-white/80 text-sm">
                <p>1️⃣ Get your unique referral link</p>
                <p>2️⃣ Share it with students who need math help</p>
                <p>3️⃣ Earn $6.00 for every person who subscribes</p>
                <p>4️⃣ Get paid monthly via PayPal/Venmo</p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <input
                placeholder="Referral code (e.g. yourname)"
                value={code}
                onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              {error && <p className="text-red-300 text-sm">{error}</p>}
              <button
                onClick={apply}
                disabled={applying || !code || !name}
                className="w-full bg-white text-violet-600 font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {applying ? "Creating..." : "Join Affiliate Program 🚀"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affiliate dashboard
  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => router.push("/dashboard")} className="text-white/70 text-sm mb-6 hover:text-white">← Back to Dashboard</button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">Affiliate Dashboard 🤝</h1>
          <p className="text-white/70 mt-1">Welcome back, {affiliate.name}!</p>
        </div>

        {/* Referral Link */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-4">
          <p className="text-white/70 text-sm mb-2">Your referral link:</p>
          <div className="flex gap-2">
            <input readOnly value={referralLink} className="flex-1 px-3 py-2 rounded-xl bg-white/10 text-white text-sm border border-white/20" />
            <button
              onClick={() => copyText(referralLink, "link")}
              className="px-4 py-2 bg-white text-violet-600 rounded-xl font-bold text-sm hover:bg-white/90 transition"
            >
              {copied === "link" ? "✓" : "Copy"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Total Referrals", value: affiliate.total_referrals, emoji: "👥" },
            { label: "Subscribers", value: affiliate.activeSubscribers, emoji: "⭐" },
            { label: "Pending", value: `$${affiliate.pending_earnings.toFixed(2)}`, emoji: "💰" },
            { label: "Paid", value: `$${affiliate.paid_earnings.toFixed(2)}`, emoji: "✅" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <div className="text-white font-bold text-xl">{s.value}</div>
              <div className="text-white/60 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Commission rate */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4 text-center">
          <p className="text-white/70 text-sm">Commission Rate: <span className="text-white font-bold">{(affiliate.commission_rate * 100).toFixed(0)}%</span> (${commissionPerSub} per subscriber)</p>
        </div>

        {/* Earnings calculator */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-4">
          <h3 className="text-white font-bold mb-3">💡 Earnings Calculator</h3>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="range"
              min="1"
              max="100"
              value={calcReferrals}
              onChange={(e) => setCalcReferrals(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-white font-bold w-12 text-right">{calcReferrals}</span>
          </div>
          <p className="text-white/80 text-center text-lg">
            Refer <span className="text-white font-bold">{calcReferrals}</span> subscribers = <span className="text-green-300 font-bold">${(calcReferrals * commissionPerSub).toFixed(2)}/month</span> passive income
          </p>
        </div>

        {/* Share section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-4">
          <h3 className="text-white font-bold mb-3">📢 Share & Earn</h3>
          <div className="space-y-3">
            {[
              { label: "Twitter/X", text: `Struggling with math? 📐 Tut City is like having a personal math tutor in your pocket! Snap a pic of any problem and get step-by-step help. Try it out: ${referralLink}` },
              { label: "Instagram/TikTok", text: `This app literally saved my math grade 🏙️📐 Just take a photo of any math problem and it walks you through every step! Link in bio: ${referralLink}` },
              { label: "Text/DM", text: `Hey! Check out this math app I've been using — you take a pic of any problem and it explains every step. Super helpful: ${referralLink}` },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/70 text-sm font-medium">{s.label}</span>
                  <button
                    onClick={() => copyText(s.text, s.label)}
                    className="text-violet-300 text-xs hover:text-white transition"
                  >
                    {copied === s.label ? "Copied! ✓" : "Copy"}
                  </button>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-white/60 text-xs leading-relaxed">{s.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals table */}
        {affiliate.referrals.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
            <h3 className="text-white font-bold mb-3">📊 Your Referrals</h3>
            <div className="space-y-2">
              {affiliate.referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <div>
                    <p className="text-white text-sm">{r.referred_user_id.slice(0, 20)}...</p>
                    <p className="text-white/50 text-xs">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      r.status === "subscribed" ? "bg-green-500/20 text-green-300" :
                      r.status === "churned" ? "bg-red-500/20 text-red-300" :
                      "bg-yellow-500/20 text-yellow-300"
                    }`}>
                      {r.status}
                    </span>
                    {r.commission_amount > 0 && (
                      <p className="text-green-300 text-xs mt-1">${r.commission_amount.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
