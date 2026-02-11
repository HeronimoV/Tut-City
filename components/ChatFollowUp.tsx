"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  problem: any;
}

export default function ChatFollowUp({ problem }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Great job working through that! 🎉 Got any questions about the steps? I'm here to help!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem,
          question,
          history: messages.filter((m) => m.role !== "assistant" || messages.indexOf(m) !== 0),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || "Hmm, I couldn't think of a response. Try asking differently!" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops, something went wrong! Try again? 😅" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl card-shadow overflow-hidden">
      <div className="gradient-bg px-4 py-3">
        <h3 className="text-white font-bold">💬 Ask me anything!</h3>
      </div>

      <div className="h-72 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-violet-500 text-white rounded-br-md"
                  : "bg-gray-100 text-gray-700 rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about any step..."
          className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-300 transition"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="gradient-bg text-white px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 transition active:scale-95"
        >
          Send
        </button>
      </div>
    </div>
  );
}
