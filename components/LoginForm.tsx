"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { GridBackground } from "./hud/GridBackground";
import { HolographicRings } from "./hud/HolographicRings";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(json.error ?? "Authentication failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "#020817" }}>
      <GridBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm mx-auto px-6"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <HolographicRings size={100} />
          </div>
          <h1 className="text-2xl font-bold tracking-wider" style={{ color: "#e2e8f0" }}>
            <span style={{ color: "#38bdf8" }} className="text-glow">Relay</span>Core
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase mt-1" style={{ color: "rgba(56,189,248,0.5)" }}>
            SECURE ACCESS TERMINAL
          </p>
        </div>

        {/* Form */}
        <div
          className="glass-card rounded-lg p-6"
          style={{ border: "1px solid rgba(56,189,248,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(56,189,248,0.6)" }}>
              IDENTITY VERIFICATION
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(56,189,248,0.7)" }}>
                USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="hud-input w-full px-3 py-2 text-sm rounded"
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(56,189,248,0.7)" }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hud-input w-full px-3 py-2 text-sm rounded"
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded text-xs"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
              >
                ⚠ {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="hud-btn hud-btn-primary w-full py-2.5 text-sm font-bold tracking-wider rounded"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full border-2 border-sky-400 border-t-transparent"
                    style={{ animation: "spin 0.6s linear infinite" }}
                  />
                  AUTHENTICATING...
                </span>
              ) : (
                "ACCESS SYSTEM →"
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs tracking-widest uppercase" style={{ color: "rgba(56,189,248,0.25)" }}>
          RELAY CORE v1.0 · SECURE LOGIN
        </p>
      </motion.div>
    </div>
  );
}
