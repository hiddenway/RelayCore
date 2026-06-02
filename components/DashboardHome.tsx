"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HolographicRings } from "./hud/HolographicRings";
import { HudCard } from "./hud/HudCard";
import { StatusBadge } from "./hud/StatusBadge";
import { timeAgo } from "@/lib/utils";
import type { EventLog } from "@/types";

interface StatsData {
  global: { total: number; success: number; failed: number };
  today: { total: number; success: number; failed: number };
  activeBots: number;
  totalBots: number;
  activeRoutes: number;
  totalRoutes: number;
}

const LEVEL_COLORS: Record<string, string> = {
  info: "#38bdf8",
  success: "#6ee7b7",
  warning: "#fcd34d",
  error: "#fca5a5",
};

export function DashboardHome() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [statsRes, logsRes] = await Promise.all([
      fetch("/api/stats"),
      fetch("/api/logs?limit=8"),
    ]);
    if (statsRes.ok) setStats(await statsRes.json());
    if (logsRes.ok) {
      const data = await logsRes.json();
      setEvents(data.events ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
        <h1 className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "rgba(56,189,248,0.6)" }}>
          CORE STATUS
        </h1>
        <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
      </div>

      {/* API Core module */}
      <HudCard glow corners label="API CORE" className="flex flex-col items-center py-6">
        <motion.div
          className="float-anim"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <HolographicRings size={160} />
        </motion.div>
        <div className="mt-4 text-center">
          <div className="text-xs font-bold tracking-[0.3em] uppercase mb-1" style={{ color: "rgba(56,189,248,0.6)" }}>
            RELAY ENGINE
          </div>
          <StatusBadge active={true} label="OPERATIONAL" />
        </div>

        {/* Stats row */}
        {stats && (
          <div className="flex gap-6 mt-4">
            <StatChip label="TOTAL EVENTS" value={stats.global.total} />
            <StatChip label="TODAY" value={stats.today.total} />
            <StatChip label="SUCCESS RATE" value={stats.global.total > 0 ? Math.round((stats.global.success / stats.global.total) * 100) + "%" : "—"} />
          </div>
        )}
      </HudCard>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="ACTIVE ROUTES"
          value={loading ? "—" : String(stats?.activeRoutes ?? 0)}
          sub={loading ? "" : `${stats?.totalRoutes ?? 0} total`}
          color="#38bdf8"
        />
        <MetricCard
          label="CONNECTED BOTS"
          value={loading ? "—" : String(stats?.activeBots ?? 0)}
          sub={loading ? "" : `${stats?.totalBots ?? 0} total`}
          color="#06b6d4"
        />
        <MetricCard
          label="EVENTS TODAY"
          value={loading ? "—" : String(stats?.today.total ?? 0)}
          sub={loading ? "" : `${stats?.today.failed ?? 0} failed`}
          color="#a78bfa"
        />
        <MetricCard
          label="ALL TIME"
          value={loading ? "—" : String(stats?.global.total ?? 0)}
          sub={loading ? "" : `${stats?.global.success ?? 0} delivered`}
          color="#34d399"
        />
      </div>

      {/* Live event stream */}
      <HudCard label="LIVE EVENT STREAM" corners>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full status-dot" style={{ background: "#10b981", boxShadow: "0 0 4px #10b981" }} />
          <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(16,185,129,0.7)" }}>
            LIVE
          </span>
          <div className="flex-1" />
          <a href="/logs" className="text-[10px] tracking-widest uppercase hud-btn px-2 py-1 rounded" style={{ color: "rgba(56,189,248,0.7)" }}>
            VIEW ALL →
          </a>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs" style={{ color: "rgba(56,189,248,0.4)" }}>
            LOADING EVENT STREAM...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "rgba(56,189,248,0.3)" }}>
              NO EVENTS YET
            </div>
            <p className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>
              Send your first event via the API or use a route&apos;s test function.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 p-2 rounded text-xs"
                style={{ background: "rgba(56,189,248,0.03)", border: "1px solid rgba(56,189,248,0.07)" }}
              >
                <div
                  className="w-1 h-full min-h-[1em] rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: LEVEL_COLORS[event.level] ?? "#38bdf8", boxShadow: `0 0 4px ${LEVEL_COLORS[event.level]}` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold" style={{ color: LEVEL_COLORS[event.level] }}>
                      {event.title ?? "Event"}
                    </span>
                    <span style={{ color: "rgba(148,163,184,0.4)" }}>·</span>
                    <span style={{ color: "rgba(56,189,248,0.6)" }}>{event.routeSlug}</span>
                    <span className="ml-auto flex-shrink-0" style={{ color: "rgba(148,163,184,0.4)" }}>
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>
                  {event.message && (
                    <div style={{ color: "rgba(148,163,184,0.7)" }} className="truncate">{event.message}</div>
                  )}
                  <div className="flex gap-1 mt-1">
                    {event.deliveries.map((d, j) => (
                      <span
                        key={j}
                        className="px-1 rounded"
                        style={{
                          fontSize: "9px",
                          background: d.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: d.success ? "#6ee7b7" : "#fca5a5",
                          border: `1px solid ${d.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                        }}
                      >
                        {d.success ? "✓" : "✗"} {d.chatId}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </HudCard>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-[10px] tracking-widest uppercase mb-0.5" style={{ color: "rgba(56,189,248,0.5)" }}>{label}</div>
      <div className="text-lg font-bold" style={{ color: "#38bdf8" }}>{value}</div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <HudCard className="text-center py-3">
      <div className="text-[10px] tracking-widest uppercase mb-2" style={{ color: "rgba(148,163,184,0.5)" }}>
        {label}
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color, textShadow: `0 0 20px ${color}40` }}>
        {value}
      </div>
      <div className="text-[10px]" style={{ color: "rgba(148,163,184,0.4)" }}>{sub}</div>
    </HudCard>
  );
}
