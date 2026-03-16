"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2, Zap } from "lucide-react";
import DashCard from "./DashCard";
import api from "@/lib/api";

interface Source {
  engine: string;
  label: string;
  value: string;
}

const SUGGESTED = [
  "What are our top growth opportunities?",
  "How is our lead pipeline performing?",
  "What's our SEO health?",
  "Give me a business overview",
];

export default function AskAeosCard() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);

  async function handleAsk(q?: string) {
    const text = q || question;
    if (!text.trim()) return;
    setLoading(true);
    setAsked(true);
    setAnswer("");
    setSources([]);
    try {
      const res = await api.post("/api/v1/copilot/ask", { question: text });
      setAnswer(res.data.answer);
      setSources(res.data.sources || []);
    } catch {
      setAnswer("Sorry, I couldn't process that question right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  return (
    <DashCard
      title="Ask AEOS"
      subtitle="AI-powered business intelligence"
      badge={
        <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-aeos-500 to-violet-500 px-2 py-0.5 text-2xs font-semibold text-white">
          <Zap size={10} />
          AI
        </span>
      }
      delay={540}
    >
      <div className="space-y-3">
        {/* Suggested questions */}
        {!asked && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => { setQuestion(q); handleAsk(q); }}
                className="rounded-pill border border-border-light bg-surface-secondary px-2.5 py-1 text-2xs text-fg-secondary transition hover:border-aeos-300 hover:bg-aeos-50 hover:text-aeos-700"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Answer */}
        {asked && (
          <div className="rounded-widget border border-border-light bg-surface-secondary p-3">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <Loader2 size={14} className="animate-spin" />
                Analyzing your business data\u2026
              </div>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-fg-secondary">{answer}</p>
                {sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border-light pt-2">
                    {sources.map((s, i) => (
                      <span key={i} className="rounded-pill bg-surface px-2 py-0.5 text-2xs text-fg-hint">
                        {s.label}: {s.value}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-widget border border-border bg-surface-secondary px-3 py-2 focus-within:border-aeos-400 focus-within:ring-2 focus-within:ring-aeos-100">
            <MessageSquare size={14} className="mr-2 shrink-0 text-fg-hint" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your business\u2026"
              className="flex-1 bg-transparent text-xs text-fg outline-none placeholder:text-fg-hint"
            />
          </div>
          <button
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-widget bg-aeos-600 text-white transition hover:bg-aeos-700 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </DashCard>
  );
}
