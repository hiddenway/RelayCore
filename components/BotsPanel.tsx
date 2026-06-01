"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { HudCard } from "./hud/HudCard";
import { StatusBadge } from "./hud/StatusBadge";
import { timeAgo } from "@/lib/utils";
import type { TelegramBot } from "@/types";

export function BotsPanel() {
  const [bots, setBots] = useState<Omit<TelegramBot, "tokenEncrypted">[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/bots");
    if (res.ok) {
      const data = await res.json();
      setBots(data.bots ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleBot(botId: string, enabled: boolean) {
    setToggling(botId);
    await fetch(`/api/bots/${botId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    await load();
    setToggling(null);
  }

  async function deleteBot(botId: string, name: string) {
    if (!confirm(`Delete bot "${name}"? Routes using this bot will stop delivering.`)) return;
    setDeleting(botId);
    await fetch(`/api/bots/${botId}`, { method: "DELETE" });
    await load();
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1 h-px" style={{ background: "rgba(14,165,233,0.1)" }} />
          <h1 className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "rgba(14,165,233,0.6)" }}>
            BOT RELAY NETWORK
          </h1>
          <div className="flex-1 h-px" style={{ background: "rgba(14,165,233,0.1)" }} />
        </div>
        <Link href="/bots/new">
          <button className="hud-btn hud-btn-primary px-4 py-2 text-xs font-bold tracking-wider rounded">
            + ADD BOT
          </button>
        </Link>
      </div>

      <HudCard corners label="CONNECTED BOTS">
        {loading ? (
          <div className="text-center py-12 text-xs" style={{ color: "rgba(14,165,233,0.4)" }}>
            LOADING BOT NETWORK...
          </div>
        ) : bots.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "rgba(14,165,233,0.3)" }}>NO BOTS CONNECTED</div>
            <Link href="/bots/new">
              <button className="hud-btn px-4 py-2 text-xs font-bold tracking-wider rounded mt-2">
                ADD FIRST BOT →
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {bots.map((bot, i) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded p-4"
                  style={{
                    background: bot.enabled ? "rgba(6,182,212,0.04)" : "rgba(2,8,23,0.6)",
                    border: `1px solid ${bot.enabled ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.07)"}`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: bot.enabled
                          ? "radial-gradient(circle, rgba(6,182,212,0.2) 0%, rgba(2,8,23,0.8) 70%)"
                          : "rgba(2,8,23,0.8)",
                        border: `1px solid ${bot.enabled ? "rgba(6,182,212,0.35)" : "rgba(6,182,212,0.1)"}`,
                        boxShadow: bot.enabled ? "0 0 12px rgba(6,182,212,0.15)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "18px", filter: bot.enabled ? "none" : "grayscale(1) opacity(0.4)" }}>🤖</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm" style={{ color: bot.enabled ? "#e2e8f0" : "#64748b" }}>
                          {bot.name}
                        </span>
                        <StatusBadge active={bot.enabled} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {bot.username && (
                          <span style={{ color: "rgba(6,182,212,0.7)" }}>@{bot.username}</span>
                        )}
                        <span style={{ color: "rgba(148,163,184,0.4)" }}>
                          ID: {bot.id}
                        </span>
                        <span style={{ color: "rgba(148,163,184,0.3)" }}>·</span>
                        <span style={{ color: "rgba(148,163,184,0.4)" }}>
                          Added {timeAgo(bot.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleBot(bot.id, !bot.enabled)}
                        disabled={toggling === bot.id}
                        className="hud-btn px-3 py-1.5 text-xs rounded"
                        style={{
                          color: bot.enabled ? "#fcd34d" : "#6ee7b7",
                          borderColor: bot.enabled ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)",
                          background: bot.enabled ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)",
                        }}
                      >
                        {toggling === bot.id ? "..." : bot.enabled ? "DISABLE" : "ENABLE"}
                      </button>
                      <button
                        onClick={() => deleteBot(bot.id, bot.name)}
                        disabled={deleting === bot.id}
                        className="hud-btn hud-btn-danger px-3 py-1.5 text-xs rounded"
                      >
                        {deleting === bot.id ? "..." : "DELETE"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </HudCard>
    </div>
  );
}
