"use client";

import { motion } from "framer-motion";
import { GridBackground } from "./hud/GridBackground";
import { HolographicRings } from "./hud/HolographicRings";

export function StorageCoreOffline() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "#020817" }}>
      <GridBackground />

      <div className="relative z-10 max-w-2xl w-full mx-auto px-6 text-center">
        {/* Top system label */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-widest uppercase"
          style={{
            border: "1px solid rgba(239,68,68,0.4)",
            background: "rgba(239,68,68,0.08)",
            color: "#fca5a5",
            borderRadius: "3px",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 status-dot" />
          STORAGE CORE OFFLINE
        </motion.div>

        {/* Rings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <HolographicRings size={180} />
            {/* Override core color to red/warning */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.04) 0%, transparent 60%)",
              }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ fontSize: "28px" }}
            >
              ⚡
            </div>
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl font-bold mb-3 tracking-tight flicker"
          style={{ color: "#e2e8f0" }}
        >
          <span style={{ color: "#38bdf8" }} className="text-glow">Relay</span>
          <span style={{ color: "#06b6d4" }}>Core</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-sm font-bold tracking-[0.3em] uppercase mb-8"
          style={{ color: "rgba(239,68,68,0.8)" }}
        >
          STORAGE SUBSYSTEM REQUIRES INITIALIZATION
        </motion.p>

        {/* Status panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="glass-card rounded-lg p-6 mb-6 text-left"
          style={{ border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(239,68,68,0.7)" }}>
              DIAGNOSTIC REPORT
            </div>
            <div className="flex-1 h-px" style={{ background: "rgba(239,68,68,0.15)" }} />
          </div>

          <div className="space-y-3">
            {[
              { label: "UPSTASH_REDIS_REST_URL  or  KV_REST_API_URL", status: "MISSING", color: "#ef4444" },
              { label: "UPSTASH_REDIS_REST_TOKEN  or  KV_REST_API_TOKEN", status: "MISSING", color: "#ef4444" },
              { label: "APP_SECRET", status: "REQUIRED", color: "#f59e0b" },
              { label: "SETUP_PASSWORD", status: "REQUIRED", color: "#f59e0b" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <code className="text-xs font-mono" style={{ color: "#94a3b8" }}>
                  {item.label}
                </code>
                <span
                  className="text-xs font-bold tracking-wider"
                  style={{ color: item.color }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="glass-card rounded-lg p-6 text-left"
          style={{ border: "1px solid rgba(14,165,233,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(14,165,233,0.7)" }}>
              INITIALIZATION PROTOCOL
            </div>
            <div className="flex-1 h-px" style={{ background: "rgba(14,165,233,0.1)" }} />
          </div>

          <div className="space-y-4 text-sm" style={{ color: "#94a3b8" }}>
            <Step n={1} title="Connect Redis Storage">
              Go to your Vercel project → <span style={{ color: "#e2e8f0" }}>Storage</span> tab → Connect Store → select{" "}
              <span style={{ color: "#38bdf8" }}>KV</span> or{" "}
              <span style={{ color: "#38bdf8" }}>Upstash Redis</span> from Marketplace.
              Both are supported.
            </Step>
            <Step n={2} title="Set Environment Variables">
              Add these variables to your Vercel project settings:
              <div className="mt-2 space-y-1">
                {["APP_SECRET=your-random-32-char-secret", "SETUP_PASSWORD=your-setup-token"].map((v) => (
                  <code
                    key={v}
                    className="block text-xs px-3 py-1.5 rounded"
                    style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.1)", color: "#38bdf8" }}
                  >
                    {v}
                  </code>
                ))}
              </div>
            </Step>
            <Step n={3} title="Redeploy">
              Trigger a new deployment or click{" "}
              <span style={{ color: "#38bdf8" }}>Redeploy</span> in the Vercel dashboard.
            </Step>
            <Step n={4} title="Complete Setup">
              After redeployment, open the app URL — you&apos;ll be guided through the setup wizard automatically.
            </Step>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-6 text-xs tracking-widest uppercase"
          style={{ color: "rgba(14,165,233,0.3)" }}
        >
          RELAY CORE v1.0 · AWAITING STORAGE CORE CONNECTION
        </motion.p>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div
        className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold mt-0.5"
        style={{
          background: "rgba(14,165,233,0.1)",
          border: "1px solid rgba(14,165,233,0.3)",
          color: "#38bdf8",
        }}
      >
        {n}
      </div>
      <div>
        <div className="font-semibold mb-0.5" style={{ color: "#e2e8f0" }}>{title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
