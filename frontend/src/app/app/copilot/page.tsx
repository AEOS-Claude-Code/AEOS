"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Loader2, Zap, Bot, User as UserIcon } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthProvider";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { engine: string; label: string; value: string }[];
  timestamp: Date;
}

const SUGGESTED = [
  "What are our top growth opportunities?",
  "How is our lead pipeline performing?",
  "What's our SEO health?",
  "Give me a full business overview",
  "What should we focus on this month?",
  "Where are our biggest risks?",
];

export default function CopilotPage() {
  const { workspace } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const question = text || input.trim();
    if (!question || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/api/v1/copilot/ask", { question });
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Sorry, I couldn't process that right now. Please try again.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-fg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-violet-500">
            <Zap size={16} className="text-white" />
          </span>
          Ask AEOS
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          AI-powered business intelligence for {workspace?.name || "your company"}.
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-card">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-aeos-50 to-violet-50">
              <Bot size={28} className="text-aeos-500" />
            </div>
            <p className="mb-1 text-sm font-semibold text-fg">What would you like to know?</p>
            <p className="mb-6 text-2xs text-fg-muted">Ask about leads, opportunities, SEO, strategy, or anything about your business.</p>
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-pill border border-border-light bg-surface-secondary px-3 py-1.5 text-2xs text-fg-secondary transition hover:border-aeos-300 hover:bg-aeos-50 hover:text-aeos-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-violet-500">
                    <Zap size={12} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-aeos-600 text-white"
                    : "border border-border-light bg-surface-secondary"
                }`}>
                  <p className={`text-xs leading-relaxed ${msg.role === "user" ? "text-white" : "text-fg-secondary"}`}>
                    {msg.content}
                  </p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 border-t border-border-light pt-2">
                      {msg.sources.map((s, i) => (
                        <span key={i} className="rounded-pill bg-surface px-2 py-0.5 text-2xs text-fg-hint">
                          {s.label}: {s.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
                    <UserIcon size={12} className="text-fg-secondary" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-violet-500">
                  <Zap size={12} className="text-white" />
                </div>
                <div className="rounded-2xl border border-border-light bg-surface-secondary px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-fg-muted">
                    <Loader2 size={14} className="animate-spin" /> Analyzing your business data…
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-2xl border border-border bg-surface px-4 py-3 shadow-card focus-within:border-aeos-400 focus-within:ring-2 focus-within:ring-aeos-100">
          <MessageSquare size={16} className="mr-3 shrink-0 text-fg-hint" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your business…"
            className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-hint"
          />
        </div>
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aeos-600 text-white shadow-card transition hover:bg-aeos-700 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
