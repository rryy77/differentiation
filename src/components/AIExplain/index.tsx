import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { explain } from "./calcSolver";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIExplain() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    try {
      const content = explain(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "解説の生成に失敗しました。もう一度お試しください。" },
      ]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 pb-12">
      <div className="rounded-2xl bg-limitdiff-card border-gradient border border-white/10 shadow-card overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-limitdiff-panel">
          <h1 className="text-2xl font-bold text-white mb-2">AI解説（微分・積分）</h1>
          <p className="text-ui-muted text-sm leading-relaxed mb-4">
            微分・積分の問題文を入力すると、ロジックに基づいた解説を表示します。多項式（x⁴, x³, x², x, 定数）の範囲で正答を計算します。
          </p>
          <div className="flex gap-3 items-end flex-wrap">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) e.preventDefault();
              }}
              placeholder="例：x² を微分せよ / ∫2x dx を求めよ"
              rows={2}
              className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/20 text-ui-base placeholder:text-ui-dim resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-accent-cyan/30 to-accent-purple/30 text-white border border-accent-cyan/40 hover:from-accent-cyan/50 hover:to-accent-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shrink-0"
            >
              解説を求める
            </button>
          </div>
        </div>

        <div className="p-4 min-h-[200px] max-h-[60vh] overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-ui-dim text-sm py-8">
              問題を入力して「解説を求める」を押してください。
              <br />
              <span className="text-ui-muted">微分・積分（多項式）の範囲で解説します。</span>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-3 whitespace-pre-wrap ${
                m.role === "user"
                  ? "ml-8 bg-accent-cyan/15 border border-accent-cyan/30 text-ui-base"
                  : "mr-8 bg-white/5 border border-white/10 text-ui-base"
              }`}
            >
              {m.role === "assistant" && (
                <span className="text-xs text-ui-muted font-medium block mb-1">解説</span>
              )}
              {m.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-limitdiff-panel flex flex-wrap gap-3 items-center">
          <span className="text-xs text-ui-muted">このアプリで確認：</span>
          <Link
            to="/custom"
            className="text-sm text-accent-cyan hover:text-white px-3 py-1.5 rounded-lg hover:bg-accent-cyan/10 transition-colors"
          >
            自分で関数を指定
          </Link>
          <Link
            to="/derivative"
            className="text-sm text-accent-purple hover:text-white px-3 py-1.5 rounded-lg hover:bg-accent-purple/10 transition-colors"
          >
            自分で導関数を指定
          </Link>
        </div>
      </div>
    </div>
  );
}
