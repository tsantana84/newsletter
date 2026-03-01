"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error);
        return;
      }

      setStatus("success");
      setMessage(data.message);
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-4 max-w-md">
        <Check className="h-5 w-5 text-green-400 shrink-0" />
        <p className="text-green-300 text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={status === "loading"}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:opacity-50 transition-colors duration-200"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="cursor-pointer rounded-xl bg-green-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-green-400 focus:glow-green disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shrink-0"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Subscribe
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-3 text-red-400 text-sm">{message}</p>
      )}
    </div>
  );
}
