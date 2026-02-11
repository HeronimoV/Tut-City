"use client";

import { useState, useEffect, useCallback } from "react";

interface PromoCode {
  type: string;
  description?: string;
  active: boolean;
  uses: number;
  maxUses?: number;
  expiresAt?: string | null;
  createdAt: string;
}

interface Stats {
  totalPromos: number;
  activePromos: number;
  totalRedemptions: number;
}

function api(path: string, opts: RequestInit = {}) {
  const secret = sessionStorage.getItem("admin_secret") || "";
  return fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      ...(opts.headers || {}),
    },
  });
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [secret, setSecret] = useState("");
  const [codes, setCodes] = useState<Record<string, PromoCode>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", type: "unlimited", maxUses: "", expiresAt: "", description: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [promosRes, statsRes] = await Promise.all([api("/api/admin/promos"), api("/api/admin/stats")]);
    if (promosRes.ok) setCodes((await promosRes.json()).codes);
    if (statsRes.ok) setStats(await statsRes.json());
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("admin_secret")) {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const handleLogin = async () => {
    sessionStorage.setItem("admin_secret", secret);
    const res = await api("/api/admin/stats");
    if (res.ok) {
      setAuthed(true);
      setError("");
    } else {
      sessionStorage.removeItem("admin_secret");
      setError("Invalid admin secret");
    }
  };

  const toggleActive = async (code: string, active: boolean) => {
    await api("/api/admin/promos", { method: "PATCH", body: JSON.stringify({ code, active: !active }) });
    load();
  };

  const createCode = async () => {
    const body: any = { code: form.code, type: form.type, description: form.description || undefined };
    if (form.maxUses) body.maxUses = parseInt(form.maxUses);
    if (form.expiresAt) body.expiresAt = form.expiresAt;
    const res = await api("/api/admin/promos", { method: "POST", body: JSON.stringify(body) });
    if (res.ok) {
      setShowCreate(false);
      setForm({ code: "", type: "unlimited", maxUses: "", expiresAt: "", description: "" });
      load();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create");
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-2">🔐 Admin Login</h1>
          <p className="text-gray-400 text-sm mb-6">Enter your admin secret to continue</p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button onClick={handleLogin} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tut City Admin</h1>
            <p className="text-gray-400 mt-1">Manage promo codes and view stats</p>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem("admin_secret"); setAuthed(false); }}
            className="text-gray-400 hover:text-white text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Promos", value: stats.totalPromos, color: "purple" },
              { label: "Active Promos", value: stats.activePromos, color: "green" },
              { label: "Total Redemptions", value: stats.totalRedemptions, color: "blue" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-gray-400 text-sm">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pricing note */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8 text-sm text-gray-400">
          💡 Manage subscription price in your <strong>Stripe Dashboard → Products → Tut City → Edit price</strong>
        </div>

        {/* Promo Codes */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Promo Codes</h2>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold transition">
            + New Code
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Create Promo Code</h3>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Code name" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="unlimited">Unlimited</option>
                <option value="limited">Limited</option>
                <option value="single-use">Single Use</option>
                <option value="expiring">Expiring</option>
              </select>
              <input placeholder="Max uses" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <input placeholder="Expires at" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 md:col-span-2" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={createCode} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold transition">Create</button>
              <button onClick={() => { setShowCreate(false); setError(""); }} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="p-4">Code</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Uses</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(codes).map(([code, promo]) => (
                  <tr key={code} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-4 font-mono font-semibold">{code}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">{promo.type}</span>
                    </td>
                    <td className="p-4">{promo.uses}{promo.maxUses ? ` / ${promo.maxUses}` : ""}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${promo.active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                        {promo.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{promo.description || "—"}</td>
                    <td className="p-4 text-gray-400">{promo.createdAt}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(code, promo.active)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${promo.active ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-green-500/20 text-green-300 hover:bg-green-500/30"}`}
                      >
                        {promo.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {Object.keys(codes).length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">No promo codes yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
