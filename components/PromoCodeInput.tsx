"use client";

import { useState } from "react";

interface Props {
  onSuccess: () => void;
}

export default function PromoCodeInput({ onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      setMessage(data.message);
      setIsError(!data.valid);
      if (data.valid) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch {
      setMessage("Something went wrong");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl card-shadow p-5">
      <h3 className="font-bold text-gray-700 text-center mb-3">🎟️ Have a promo code?</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Enter code..."
          className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm font-mono tracking-wider outline-none focus:ring-2 focus:ring-violet-300 transition uppercase"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="bg-violet-100 text-violet-700 font-bold px-5 py-3 rounded-xl hover:bg-violet-200 transition active:scale-95 disabled:opacity-50 text-sm"
        >
          {loading ? "..." : "Apply"}
        </button>
      </div>
      {message && (
        <p className={`text-sm mt-2 text-center font-medium ${isError ? "text-red-500" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
