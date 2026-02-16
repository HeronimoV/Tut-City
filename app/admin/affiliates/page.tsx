"use client";

import { useState, useEffect, useCallback } from "react";

interface Affiliate {
  id: string;
  user_id: string;
  code: string;
  name: string;
  email: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  active: boolean;
  created_at: string;
}

function api(path: string, opts: RequestInit = {}) {
  const secret = sessionStorage.getItem("admin_secret") || "";
  return fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}`, ...(opts.headers || {}) },
  });
}

export default function AdminAffiliatesPage() {
  const [authed, setAuthed] = useState(false);
  const [secret, setSecret] = useState("");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", email: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await api("/api/admin/affiliates");
    if (res.ok) {
      const data = await res.json();
      setAffiliates(data.affiliates);
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("admin_secret")) setAuthed(true);
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  const handleLogin = async () => {
    sessionStorage.setItem("admin_secret", secret);
    const res = await api("/api/admin/stats");
    if (res.ok) { setAuthed(true); setError(""); }
    else { sessionStorage.removeItem("admin_secret"); setError("Invalid admin secret"); }
  };

  const createAffiliate = async () => {
    const res = await api("/api/admin/affiliates", { method: "POST", body: JSON.stringify({ code: form.code, name: form.name, email: form.email }) });
    if (res.ok) { setShowCreate(false); setForm({ code: "", name: "", email: "" }); load(); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await api("/api/admin/affiliates", { method: "PATCH", body: JSON.stringify({ affiliateId: id, active: !active }) });
    load();
  };

  const markPaid = async (id: string, amount: number) => {
    if (amount <= 0) return;
    if (!confirm(`Mark $${amount.toFixed(2)} as paid?`)) return;
    await api("/api/admin/affiliates", { method: "PATCH", body: JSON.stringify({ affiliateId: id, action: "mark_paid", amount }) });
    load();
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-2">🔐 Admin Login</h1>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <input type="password" placeholder="Admin secret" value={secret} onChange={(e) => setSecret(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <button onClick={handleLogin} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition">Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Affiliate Management</h1>
            <p className="text-gray-400 mt-1">{affiliates.length} affiliates</p>
          </div>
          <div className="flex gap-3">
            <a href="/admin" className="text-gray-400 hover:text-white text-sm">← Back to Admin</a>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold transition">+ New Affiliate</button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Affiliates", value: affiliates.length },
            { label: "Active", value: affiliates.filter(a => a.active).length },
            { label: "Pending Payouts", value: `$${affiliates.reduce((s, a) => s + a.pending_earnings, 0).toFixed(2)}` },
            { label: "Total Paid", value: `$${affiliates.reduce((s, a) => s + a.paid_earnings, 0).toFixed(2)}` },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Create Affiliate</h3>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={createAffiliate} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold transition">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="p-4">Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Referrals</th>
                  <th className="p-4">Pending</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Rate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((a) => (
                  <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-4">
                      <div className="font-semibold">{a.name || "—"}</div>
                      <div className="text-gray-500 text-xs">{a.email}</div>
                    </td>
                    <td className="p-4 font-mono">{a.code}</td>
                    <td className="p-4">{a.total_referrals}</td>
                    <td className="p-4 text-yellow-300">${a.pending_earnings.toFixed(2)}</td>
                    <td className="p-4 text-green-300">${a.paid_earnings.toFixed(2)}</td>
                    <td className="p-4">{(a.commission_rate * 100).toFixed(0)}%</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${a.active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                        {a.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => toggleActive(a.id, a.active)} className={`px-3 py-1 rounded text-xs font-semibold transition ${a.active ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-green-500/20 text-green-300 hover:bg-green-500/30"}`}>
                          {a.active ? "Deactivate" : "Activate"}
                        </button>
                        {a.pending_earnings > 0 && (
                          <button onClick={() => markPaid(a.id, a.pending_earnings)} className="px-3 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition">
                            Pay ${a.pending_earnings.toFixed(2)}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {affiliates.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">No affiliates yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
