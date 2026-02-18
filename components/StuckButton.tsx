"use client";

import { useState, useRef, useEffect } from "react";

interface StepInfo {
  stepNumber: number;
  action: string;
  why: string;
  result: string;
  problem: string;
  concept: string;
}

interface Props {
  stepInfo: StepInfo | null;
}

const QUICK_REPLIES = [
  "I don't understand this step",
  "Can you explain differently?",
  "Give me a hint",
];

export default function StuckButton({ stepInfo }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset messages when step changes
  useEffect(() => {
    setMessages([]);
  }, [stepInfo?.stepNumber]);

  if (!stepInfo) return null;

  const sendQuestion = async (question: string) => {
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepInfo, question }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.hint || "Try re-reading the step carefully! You've got this! 💪" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Hmm, couldn't get a hint right now. Try re-reading the step! 💪" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-violet-500 rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-violet-600 transition-all active:scale-90 z-50 hover:shadow-xl"
          style={{ animation: "pulse 2s infinite" }}
        >
          💡
        </button>
      )}

      {/* Expanded chat */}
      {open && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-violet-100 z-50 flex flex-col overflow-hidden"
          style={{ maxHeight: "70vh", animation: "slideUp 0.2s ease-out" }}
        >
          {/* Header */}
          <div className="gradient-bg px-4 py-3 flex items-center justify-between shrink-0">
            <span className="text-white font-bold text-sm">💡 Need help with Step {stepInfo.stepNumber}?</span>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-lg">✕</button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[120px]">
            {messages.length === 0 && (
              <p className="text-gray-400 text-sm text-center">Tap a quick reply or ask your question!</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-violet-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-700 rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick replies */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2 shrink-0">
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => !loading && sendQuestion(q)}
                  disabled={loading}
                  className="bg-violet-50 text-violet-600 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-violet-100 transition disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
