"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HudCard } from "./hud/HudCard";
import { timeAgo, formatDate } from "@/lib/utils";
import type { EventLog, Route } from "@/types";

const LEVEL_COLORS: Record<string, string> = {
  info: "#38bdf8",
  success: "#6ee7b7",
  warning: "#fcd34d",
  error: "#fca5a5",
};

const LEVEL_BG: Record<string, string> = {
  info: "rgba(56,189,248,0.08)",
  success: "rgba(16,185,129,0.08)",
  warning: "rgba(245,158,11,0.08)",
  error: "rgba(239,68,68,0.08)",
};

const LEVEL_BORDER: Record<string, string> = {
  info: "rgba(56,189,248,0.18)",
  success: "rgba(16,185,129,0.18)",
  warning: "rgba(245,158,11,0.18)",
  error: "rgba(239,68,68,0.18)",
};

function payloadToString(payload: unknown): string {
  if (payload === undefined || payload === null) return "";
  if (typeof payload === "string") return payload;
  return JSON.stringify(payload, null, 2);
}

export function LogsPanel() {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeFilter, setRouteFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    const url = routeFilter
      ? `/api/logs?route=${routeFilter}&limit=100`
      : "/api/logs?limit=100";
    const [logsRes, routesRes] = await Promise.all([fetch(url), fetch("/api/routes")]);
    if (logsRes.ok) setEvents((await logsRes.json()).events ?? []);
    if (routesRes.ok) setRoutes((await routesRes.json()).routes ?? []);
    setLoading(false);
  }, [routeFilter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const filtered = events.filter((e) => {
    if (levelFilter && e.level !== levelFilter) return false;
    if (statusFilter === "ok" && e.deliveries.some((d) => !d.success)) return false;
    if (statusFilter === "failed" && e.deliveries.every((d) => d.success)) return false;
    return true;
  });

  const failedCount = events.filter((e) => e.deliveries.some((d) => !d.success)).length;
  const successCount = events.filter((e) => e.deliveries.every((d) => d.success)).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
          <h1 className="text-xs font-bold tracking-[0.3em] uppercase whitespace-nowrap" style={{ color: "rgba(56,189,248,0.7)" }}>
            REQUEST LOG
          </h1>
          <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
        </div>
        <button
          onClick={() => { setLoading(true); load(); }}
          className="hud-btn px-3 py-1.5 text-xs rounded flex-shrink-0"
        >
          ↺ REFRESH
        </button>
      </div>

      {/* Summary bar */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryChip label="TOTAL" value={events.length} color="#38bdf8" />
          <SummaryChip label="DELIVERED" value={successCount} color="#6ee7b7" />
          <SummaryChip label="FAILED" value={failedCount} color={failedCount > 0 ? "#fca5a5" : "#6ee7b7"} alert={failedCount > 0} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
          className="hud-input px-3 py-1.5 text-xs rounded"
          style={{ minWidth: "140px" }}
        >
          <option value="">ALL ROUTES</option>
          {routes.map((r) => (
            <option key={r.slug} value={r.slug}>{r.name}</option>
          ))}
        </select>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="hud-input px-3 py-1.5 text-xs rounded"
        >
          <option value="">ALL LEVELS</option>
          <option value="info">INFO</option>
          <option value="success">SUCCESS</option>
          <option value="warning">WARNING</option>
          <option value="error">ERROR</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="hud-input px-3 py-1.5 text-xs rounded"
        >
          <option value="">ALL STATUS</option>
          <option value="ok">DELIVERED</option>
          <option value="failed">FAILED</option>
        </select>

        {(routeFilter || levelFilter || statusFilter) && (
          <button
            onClick={() => { setRouteFilter(""); setLevelFilter(""); setStatusFilter(""); }}
            className="hud-btn px-3 py-1.5 text-xs rounded"
            style={{ color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }}
          >
            ✕ CLEAR
          </button>
        )}

        <span className="ml-auto text-xs self-center" style={{ color: "rgba(148,163,184,0.4)" }}>
          {loading ? "loading..." : `${filtered.length} events`}
        </span>
      </div>

      {/* Log list */}
      <div className="space-y-2">
        {loading ? (
          <HudCard>
            <div className="text-center py-12 text-xs" style={{ color: "rgba(56,189,248,0.4)" }}>
              LOADING EVENT LOG...
            </div>
          </HudCard>
        ) : filtered.length === 0 ? (
          <HudCard>
            <div className="text-center py-12 text-xs" style={{ color: "rgba(56,189,248,0.3)" }}>
              NO EVENTS MATCH FILTERS
            </div>
          </HudCard>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((event, i) => {
              const allOk = event.deliveries.every((d) => d.success);
              const allFail = event.deliveries.every((d) => !d.success);
              const partial = !allOk && !allFail;
              const isOpen = expanded === event.id;
              const payloadStr = payloadToString(event.payload);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.2) }}
                >
                  <div
                    className="rounded overflow-hidden cursor-pointer"
                    style={{
                      background: isOpen ? LEVEL_BG[event.level] : "rgba(56,189,248,0.02)",
                      border: `1px solid ${isOpen ? LEVEL_BORDER[event.level] : "rgba(56,189,248,0.08)"}`,
                      transition: "all 0.15s",
                    }}
                    onClick={() => setExpanded(isOpen ? null : event.id)}
                  >
                    {/* Row */}
                    <div className="flex items-center gap-2 px-3 py-2.5 text-xs">
                      {/* Level stripe */}
                      <div
                        className="w-0.5 h-5 rounded-full flex-shrink-0"
                        style={{ background: LEVEL_COLORS[event.level], boxShadow: `0 0 6px ${LEVEL_COLORS[event.level]}` }}
                      />

                      {/* Level badge */}
                      <span className={`badge badge-${event.level} flex-shrink-0`}>{event.level}</span>

                      {/* Route */}
                      <code
                        className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px]"
                        style={{ background: "rgba(56,189,248,0.08)", color: "#7dd3fc", border: "1px solid rgba(56,189,248,0.15)" }}
                      >
                        /api/r/{event.routeSlug}
                      </code>

                      {/* Title */}
                      <span className="flex-1 truncate font-medium" style={{ color: "#e2e8f0" }}>
                        {event.title || <span style={{ color: "rgba(148,163,184,0.4)" }}>no title</span>}
                      </span>

                      {/* Delivery status */}
                      <span
                        className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          background: allOk
                            ? "rgba(16,185,129,0.1)"
                            : allFail
                            ? "rgba(239,68,68,0.1)"
                            : "rgba(245,158,11,0.1)",
                          color: allOk ? "#6ee7b7" : allFail ? "#fca5a5" : "#fcd34d",
                          border: `1px solid ${allOk ? "rgba(16,185,129,0.25)" : allFail ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"}`,
                        }}
                      >
                        {allOk ? "✓ DELIVERED" : allFail ? "✗ FAILED" : "⚠ PARTIAL"}
                        <span style={{ opacity: 0.6 }}>{event.deliveries.length > 1 ? ` ×${event.deliveries.length}` : ""}</span>
                      </span>

                      {/* Time */}
                      <span className="flex-shrink-0 text-[10px]" style={{ color: "rgba(148,163,184,0.4)" }}>
                        {timeAgo(event.timestamp)}
                      </span>

                      {/* Expand arrow */}
                      <span
                        className="flex-shrink-0 text-[10px] transition-transform duration-200"
                        style={{
                          color: "rgba(56,189,248,0.4)",
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          display: "inline-block",
                        }}
                      >
                        ▾
                      </span>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ borderTop: `1px solid ${LEVEL_BORDER[event.level]}` }}
                        >
                          <div className="px-3 py-3 space-y-3 text-xs">
                            {/* Meta row */}
                            <div className="flex flex-wrap gap-x-6 gap-y-1">
                              <MetaField label="EVENT ID" value={event.id} mono />
                              <MetaField label="TIMESTAMP" value={formatDate(event.timestamp)} />
                              <MetaField label="ROUTE" value={event.routeSlug} mono />
                              <MetaField label="LEVEL" value={event.level.toUpperCase()} />
                            </div>

                            {/* Request section */}
                            <Section label="REQUEST BODY">
                              <div className="space-y-2">
                                {event.title && <Field label="title" value={event.title} />}
                                {event.message && <Field label="message" value={event.message} />}
                                {payloadStr && (
                                  <div>
                                    <span className="text-[10px] font-bold tracking-wider uppercase mr-2" style={{ color: "rgba(56,189,248,0.5)" }}>payload</span>
                                    <pre
                                      className="mt-1 p-2 rounded overflow-x-auto"
                                      style={{ background: "rgba(0,0,0,0.3)", color: "#94a3b8", fontSize: "11px", maxHeight: "200px" }}
                                    >
                                      {payloadStr}
                                    </pre>
                                  </div>
                                )}
                                {!event.title && !event.message && !payloadStr && (
                                  <span style={{ color: "rgba(148,163,184,0.4)" }}>empty body</span>
                                )}
                              </div>
                            </Section>

                            {/* Delivery results */}
                            <Section label={`DELIVERY RESULTS (${event.deliveries.length} target${event.deliveries.length !== 1 ? "s" : ""})`}>
                              <div className="space-y-1.5">
                                {event.deliveries.map((d, j) => (
                                  <div
                                    key={j}
                                    className="flex items-start gap-2 p-2 rounded"
                                    style={{
                                      background: d.success ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
                                      border: `1px solid ${d.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                                    }}
                                  >
                                    <span
                                      className="font-bold flex-shrink-0 mt-0.5"
                                      style={{ color: d.success ? "#6ee7b7" : "#fca5a5" }}
                                    >
                                      {d.success ? "✓" : "✗"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                        <span style={{ color: "rgba(148,163,184,0.7)" }}>
                                          chat <code style={{ color: "#7dd3fc" }}>{d.chatId}</code>
                                        </span>
                                        {d.messageId && (
                                          <span style={{ color: "rgba(148,163,184,0.5)" }}>
                                            msg_id: {d.messageId}
                                          </span>
                                        )}
                                      </div>
                                      {d.error && (
                                        <div
                                          className="mt-1 px-2 py-1 rounded"
                                          style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}
                                        >
                                          ⚠ {d.error}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Section>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function SummaryChip({ label, value, color, alert }: { label: string; value: number; color: string; alert?: boolean }) {
  return (
    <div
      className="rounded px-3 py-2 text-center"
      style={{
        background: alert ? "rgba(239,68,68,0.07)" : "rgba(56,189,248,0.04)",
        border: `1px solid ${alert ? "rgba(239,68,68,0.2)" : "rgba(56,189,248,0.1)"}`,
      }}
    >
      <div className="text-xl font-bold" style={{ color, textShadow: `0 0 12px ${color}40` }}>{value}</div>
      <div className="text-[9px] font-bold tracking-widest uppercase mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>{label}</div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[10px] font-bold tracking-widest uppercase mb-2 pb-1"
        style={{ color: "rgba(56,189,248,0.55)", borderBottom: "1px solid rgba(56,189,248,0.08)" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] font-bold tracking-wider uppercase flex-shrink-0" style={{ color: "rgba(56,189,248,0.5)" }}>
        {label}
      </span>
      <span style={{ color: "#cbd5e1" }}>{value}</span>
    </div>
  );
}

function MetaField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-bold tracking-widest uppercase mb-0.5" style={{ color: "rgba(56,189,248,0.4)" }}>{label}</div>
      {mono
        ? <code className="text-[10px]" style={{ color: "#7dd3fc" }}>{value}</code>
        : <span className="text-[10px]" style={{ color: "#94a3b8" }}>{value}</span>
      }
    </div>
  );
}
