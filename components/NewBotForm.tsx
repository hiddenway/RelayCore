"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HudCard } from "./hud/HudCard";

export function NewBotForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!name) { setError("Bot name is required"); return; }
    if (!token) { setError("Bot token is required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, token }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to add bot"); return; }
      setSuccess(true);
      setTimeout(() => router.push("/bots"), 1500);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
        <h1 className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "rgba(56,189,248,0.6)" }}>
          ADD TELEGRAM BOT
        </h1>
        <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
      </div>

      <HudCard corners>
        <div className="space-y-4">
          <div
            className="p-3 rounded text-xs"
            style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.1)", color: "#94a3b8" }}
          >
            <div className="font-bold mb-1" style={{ color: "#38bdf8" }}>How to get a bot token:</div>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Open Telegram and search for <strong style={{ color: "#e2e8f0" }}>@BotFather</strong></li>
              <li>Send <code style={{ color: "#38bdf8" }}>/newbot</code> and follow instructions</li>
              <li>Copy the HTTP API token provided</li>
            </ol>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(56,189,248,0.7)" }}>
              BOT NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="hud-input w-full px-3 py-2 text-sm rounded"
              placeholder="Production Alert Bot"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(56,189,248,0.7)" }}>
              BOT TOKEN
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="hud-input w-full px-3 py-2 text-sm rounded"
              placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
            />
            <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.5)" }}>
              Token is encrypted with APP_SECRET before storage
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded text-xs"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
            >
              ⚠ {error}
            </motion.div>
          )}

          {success && (
            <div className="p-3 rounded text-xs" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" }}>
              ✓ Bot added successfully! Redirecting...
            </div>
          )}
        </div>
      </HudCard>

      <div className="flex gap-3">
        <button onClick={() => router.push("/bots")} className="hud-btn flex-1 py-2.5 text-sm font-bold tracking-wider rounded">
          CANCEL
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || success}
          className="hud-btn hud-btn-primary flex-1 py-2.5 text-sm font-bold tracking-wider rounded"
        >
          {loading ? "VALIDATING..." : success ? "ADDED ✓" : "ADD BOT →"}
        </button>
      </div>
    </div>
  );
}
