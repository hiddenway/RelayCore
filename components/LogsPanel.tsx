"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { HudCard } from "./hud/HudCard";
import { timeAgo } from "@/lib/utils";
import type { EventLog, Route } from "@/types";

const LEVEL_COLORS: Record<string, string> = {
  info: "#38bdf8",
  success: "#6ee7b7",
  warning: "#fcd34d",
  error: "#fca5a5",
};

export function LogsPanel() {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeFilter, setRouteFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    const url = routeFilter ? `/api/logs?route=${routeFilter}&limit=100` : "/api/logs?limit=100";
    const [logsRes, routesRes] = await Promise.all([fetch(url), fetch("/api/routes")]);
    if (logsRes.ok) setEvents((await logsRes.json()).events ?? []);
    if (routesRes.ok) setRoutes((await routesRes.json()).routes ?? []);
    setLoading(false);
  }, [routeFilter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
          <h1 className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "rgba(56,189,248,0.6)" }}>
            EVENT STREAM LOG
          </h1>
          <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
        </div>

        {/* Filter */}
        <select
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
          className="hud-input px-3 py-1.5 text-xs rounded"
          style={{ minWidth: "160px" }}
        >
          <option value="">ALL ROUTES</option>
          {routes.map((r) => (
            <option key={r.slug} value={r.slug}>{r.name}</option>
          ))}
        </select>
      </div>

      <HudCard corners label="EVENT LOG">
        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full status-dot" style={{ background: "#10b981", boxShadow: "0 0 4px #10b981" }} />
          <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(16,185,129,0.7)" }}>LIVE STREAM</span>
          <span style={{ color: "rgba(56,189,248,0.3)" }}>·</span>
          <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.4)" }}>
            {loading ? "Loading..." : `${events.length} events`}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs" style={{ color: "rgba(56,189,248,0.4)" }}>
            LOADING EVENT STREAM...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xs tracking-widest uppercase" style={{ color: "rgba(56,189,248,0.3)" }}>
              NO EVENTS IN LOG
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <div
                  className="p-3 rounded cursor-pointer transition-all"
                  style={{
                    background: expanded === event.id ? "rgba(56,189,248,0.06)" : "rgba(56,189,248,0.02)",
                    border: `1px solid ${expanded === event.id ? "rgba(56,189,248,0.2)" : "rgba(56,189,248,0.07)"}`,
                  }}
                  onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-4 rounded-full flex-shrink-0"
                      style={{ background: LEVEL_COLORS[event.level], boxShadow: `0 0 4px ${LEVEL_COLORS[event.level]}` }}
                    />
                    <span className={`badge badge-${event.level}`}>{event.level}</span>
                    <span className="text-sm font-semibold flex-1 truncate" style={{ color: "#e2e8f0" }}>
                      {event.title ?? "Event"}
                    </span>
                    <code className="text-xs flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: "rgba(56,189,248,0.08)", color: "#38bdf8" }}>
                      {event.routeSlug}
                    </code>
                    <div className="flex gap-1 flex-shrink-0">
                      {event.deliveries.map((d, j) => (
                        <span
                          key={j}
                          className="text-[9px] px-1 rounded"
                          style={{
                            background: d.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            color: d.success ? "#6ee7b7" : "#fca5a5",
                          }}
                        >
                          {d.success ? "✓" : "✗"}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: "rgba(148,163,184,0.4)" }}>
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>

                  {expanded === event.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 pt-3 space-y-2 text-xs"
                      style={{ borderTop: "1px solid rgba(56,189,248,0.1)" }}
                    >
                      {event.message && (
                        <div>
                          <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(56,189,248,0.5)" }}>MESSAGE</div>
                          <p style={{ color: "#94a3b8" }}>{event.message}</p>
                        </div>
                      )}

                      {event.payload && Object.keys(event.payload).length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(56,189,248,0.5)" }}>PAYLOAD</div>
                          <pre
                            className="p-2 rounded overflow-x-auto"
                            style={{ background: "rgba(56,189,248,0.04)", color: "#94a3b8" }}
                          >
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div>
                        <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(56,189,248,0.5)" }}>DELIVERIES</div>
                        <div className="space-y-1">
                          {event.deliveries.map((d, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <span style={{ color: d.success ? "#6ee7b7" : "#fca5a5" }}>{d.success ? "✓" : "✗"}</span>
                              <span style={{ color: "#94a3b8" }}>Chat {d.chatId}</span>
                              {d.error && <span style={{ color: "#fca5a5" }}>— {d.error}</span>}
                              {d.messageId && <span style={{ color: "rgba(148,163,184,0.4)" }}>msg:{d.messageId}</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ color: "rgba(148,163,184,0.4)" }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </HudCard>
    </div>
  );
}
