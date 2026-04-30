"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, Send, X, Bot, User as UserIcon } from "lucide-react";
import { streamEmailRefinement, type EmailTemplate, type EmailGeneratorResult } from "@/lib/email-templates-admin";

type ChatMessage = { role: "user" | "assistant"; content: string };

type Props = {
  template: EmailTemplate;
  onApply: (next: EmailGeneratorResult) => void;
  onClose: () => void;
};

export default function AIAssistantPanel({ template, onApply, onClose }: Props) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, busy]);

  const send = async () => {
    if (!draft.trim() || busy) return;
    const userMsg = draft.trim();
    setDraft("");
    setError(null);
    setStatus("Verbinde…");

    // Optimistic: zeige user message sofort
    const newHistory = [...history, { role: "user" as const, content: userMsg }];
    setHistory(newHistory);
    setBusy(true);

    try {
      await streamEmailRefinement({
        existing_template: template,
        user_message: userMsg,
        // chat_history ist alles VOR diesem user-msg
        chat_history: history,
        onText: () => setStatus("Schreibt…"),
        onResult: (result) => {
          // Apply changes to template
          onApply(result);
          // Append assistant message to chat
          const aMsg = result.assistant_message || "Änderungen angewendet.";
          setHistory([...newHistory, { role: "assistant", content: aMsg }]);
          setStatus("");
        },
        onError: (msg) => {
          setError(msg);
          setStatus("");
        },
      });
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-40">
      <header className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-turquoise-light to-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-turquoise" />
          <h3 className="text-sm font-semibold text-dark">KI-Assistent</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-subtle">
          <X className="w-4 h-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 && (
          <div className="text-center py-6 text-subtle">
            <Bot className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs leading-relaxed">
              Beschreib was du am Template ändern willst.<br />
              Beispiel:<br />
              <em className="text-dark">„Bitte den Bank-Namen in Betreff und Text einbauen"</em><br />
              <em className="text-dark">„Ton freundlicher machen"</em><br />
              <em className="text-dark">„Mehr Conversion-fokussiert"</em>
            </p>
          </div>
        )}

        {history.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-turquoise-light flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-turquoise" />
              </div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
              m.role === "user"
                ? "bg-turquoise text-white rounded-br-sm"
                : "bg-gray-100 text-dark rounded-bl-sm"
            }`}>
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-subtle" />
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-turquoise-light flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-turquoise" />
            </div>
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-gray-100 text-subtle text-sm inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {status || "Denkt nach…"}
            </div>
          </div>
        )}

        {error && (
          <div className="p-2 rounded-lg bg-red-50 text-red-700 text-xs">{error}</div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
            rows={2}
            placeholder="Was soll geändert werden?"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-turquoise"
          />
          <button onClick={send} disabled={busy || !draft.trim()}
                  className="p-2 rounded-lg bg-turquoise hover:bg-turquoise-dark text-white disabled:opacity-50 transition-colors shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-subtle mt-1.5">Enter sendet, Shift+Enter für neue Zeile.</p>
      </div>
    </div>
  );
}
