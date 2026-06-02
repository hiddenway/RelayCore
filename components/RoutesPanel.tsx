"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { HudCard } from "./hud/HudCard";
import { StatusBadge } from "./hud/StatusBadge";
import { timeAgo } from "@/lib/utils";
import type { Route } from "@/types";

export function RoutesPanel() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/routes");
    if (res.ok) {
      const data = await res.json();
      setRoutes(data.routes ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleRoute(slug: string, enabled: boolean) {
    setToggling(slug);
    await fetch(`/api/routes/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    await load();
    setToggling(null);
  }

  async function deleteRoute(slug: string) {
    if (!confirm(`Delete route "${slug}"? This cannot be undone.`)) return;
    setDeleting(slug);
    await fetch(`/api/routes/${slug}`, { method: "DELETE" });
    await load();
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
          <h1 className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "rgba(56,189,248,0.6)" }}>
            ROUTE MATRIX
          </h1>
          <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
        </div>
        <Link href="/routes/new">
          <button className="hud-btn hud-btn-primary px-4 py-2 text-xs font-bold tracking-wider rounded">
            + NEW ROUTE
          </button>
        </Link>
      </div>

      {/* Routes list */}
      <HudCard corners label="ACTIVE ROUTES">
        {loading ? (
          <div className="text-center py-12 text-xs" style={{ color: "rgba(56,189,248,0.4)" }}>
            LOADING ROUTES...
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "rgba(56,189,248,0.3)" }}>NO ROUTES CONFIGURED</div>
            <Link href="/routes/new">
              <button className="hud-btn px-4 py-2 text-xs font-bold tracking-wider rounded mt-2">
                CREATE FIRST ROUTE →
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {routes.map((route, i) => (
                <motion.div
                  key={route.slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded p-4 relative"
                  style={{
                    background: route.enabled ? "rgba(56,189,248,0.04)" : "rgba(2,8,23,0.6)",
                    border: `1px solid ${route.enabled ? "rgba(56,189,248,0.15)" : "rgba(56,189,248,0.07)"}`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div className="flex-shrink-0 mt-0.5">
                      <StatusBadge active={route.enabled} size="sm" />
                    </div>

                    {/* Route info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm" style={{ color: route.enabled ? "#e2e8f0" : "#64748b" }}>
                          {route.name}
                        </span>
                        <code
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background: "rgba(56,189,248,0.08)",
                            border: "1px solid rgba(56,189,248,0.15)",
                            color: "#38bdf8",
                          }}
                        >
                          /api/r/{route.slug}
                        </code>
                      </div>

                      {route.description && (
                        <p className="text-xs mb-2" style={{ color: "rgba(148,163,184,0.6)" }}>{route.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs">
                        <span style={{ color: "rgba(148,163,184,0.5)" }}>
                          {route.targets.length} target{route.targets.length !== 1 ? "s" : ""}
                        </span>
                        <span style={{ color: "rgba(56,189,248,0.3)" }}>·</span>
                        <span style={{ color: "rgba(148,163,184,0.4)" }}>
                          Updated {timeAgo(route.updatedAt)}
                        </span>
                      </div>

                      {/* Targets */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {route.targets.map((t, j) => (
                          <span
                            key={j}
                            className="text-[10px] px-2 py-0.5 rounded"
                            style={{
                              background: "rgba(6,182,212,0.08)",
                              border: "1px solid rgba(6,182,212,0.15)",
                              color: "#67e8f9",
                            }}
                          >
                            ⊕ {t.chatName ?? t.chatId}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleRoute(route.slug, !route.enabled)}
                        disabled={toggling === route.slug}
                        className="hud-btn px-3 py-1.5 text-xs rounded"
                        style={{
                          color: route.enabled ? "#fcd34d" : "#6ee7b7",
                          borderColor: route.enabled ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)",
                          background: route.enabled ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)",
                        }}
                      >
                        {toggling === route.slug ? "..." : route.enabled ? "DISABLE" : "ENABLE"}
                      </button>
                      <Link href={`/routes/${route.slug}`}>
                        <button className="hud-btn px-3 py-1.5 text-xs rounded">MANAGE</button>
                      </Link>
                      <button
                        onClick={() => deleteRoute(route.slug)}
                        disabled={deleting === route.slug}
                        className="hud-btn hud-btn-danger px-3 py-1.5 text-xs rounded"
                      >
                        {deleting === route.slug ? "..." : "DEL"}
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
