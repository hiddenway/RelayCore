"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HudCard } from "./hud/HudCard";
import { StatusBadge } from "./hud/StatusBadge";
import { timeAgo } from "@/lib/utils";
import type { Route, EventLog } from "@/types";

export function RouteDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    const [routeRes, logsRes] = await Promise.all([
      fetch(`/api/routes/${slug}`),
      fetch(`/api/logs?route=${slug}&limit=10`),
    ]);
    if (routeRes.ok) {
      const d = await routeRes.json();
      setRoute(d.route);
    }
    if (logsRes.ok) {
      const d = await logsRes.json();
      setEvents(d.events ?? []);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function revealKey() {
    setRevealing(true);
    const res = await fetch(`/api/routes/${slug}/reveal-key`);
    if (res.ok) {
      const data = await res.json();
      setRevealedKey(data.apiKey);
    }
    setRevealing(false);
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenerateKey() {
    if (!confirm("Regenerate API key? The current key will stop working immediately.")) return;
    setRegenerating(true);
    setRevealedKey(null);
    const res = await fetch(`/api/routes/${slug}/regenerate-key`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setNewApiKey(data.apiKey);
    }
    setRegenerating(false);
  }

  async function sendTestEvent() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/test-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeSlug: slug }),
    });
    const json = await res.json();
    if (res.ok) {
      setTestResult({ ok: true, message: `Delivered to ${json.deliveries?.filter((d: {success:boolean}) => d.success).length ?? 0} target(s)` });
      await load();
    } else {
      setTestResult({ ok: false, message: json.error ?? "Test failed" });
    }
    setTesting(false);
  }

  async function toggleRoute() {
    if (!route) return;
    await fetch(`/api/routes/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !route.enabled }),
    });
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xs tracking-widest uppercase" style={{ color: "rgba(14,165,233,0.4)" }}>
          LOADING ROUTE DATA...
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="text-center py-20">
        <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "rgba(239,68,68,0.6)" }}>ROUTE NOT FOUND</div>
        <button onClick={() => router.push("/routes")} className="hud-btn px-4 py-2 text-xs rounded mt-2">← BACK TO ROUTES</button>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/routes")} className="hud-btn px-3 py-1.5 text-xs rounded">
          ← BACK
        </button>
        <div className="flex-1 h-px" style={{ background: "rgba(14,165,233,0.1)" }} />
        <h1 className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "rgba(14,165,233,0.6)" }}>
          ROUTE: {slug.toUpperCase()}
        </h1>
        <div className="flex-1 h-px" style={{ background: "rgba(14,165,233,0.1)" }} />
      </div>

      {/* Route overview */}
      <HudCard glow corners label="ROUTE CONFIG">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-bold" style={{ color: "#e2e8f0" }}>{route.name}</h2>
              <StatusBadge active={route.enabled} />
            </div>
            {route.description && (
              <p className="text-sm mb-3" style={{ color: "rgba(148,163,184,0.7)" }}>{route.description}</p>
            )}
            <code
              className="text-sm px-3 py-1.5 rounded inline-block"
              style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", color: "#38bdf8" }}
            >
              POST {origin}/api/r/{slug}
            </code>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={toggleRoute}
              className="hud-btn px-3 py-1.5 text-xs rounded"
              style={{ color: route.enabled ? "#fcd34d" : "#6ee7b7" }}
            >
              {route.enabled ? "DISABLE" : "ENABLE"}
            </button>
            <button
              onClick={sendTestEvent}
              disabled={testing}
              className="hud-btn hud-btn-primary px-3 py-1.5 text-xs font-bold rounded"
            >
              {testing ? "..." : "▶ TEST"}
            </button>
          </div>
        </div>

        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 rounded text-xs"
            style={{
              background: testResult.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${testResult.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: testResult.ok ? "#6ee7b7" : "#fca5a5",
            }}
          >
            {testResult.ok ? "✓ " : "✗ "}{testResult.message}
          </motion.div>
        )}
      </HudCard>

      {/* API Key panel */}
      <HudCard corners label="API CREDENTIALS">
        {/* Show newly regenerated key */}
        {newApiKey && (
          <div className="mb-4">
            <div className="text-xs mb-2" style={{ color: "rgba(245,158,11,0.8)" }}>
              ⚠ New key generated — copy it now
            </div>
            <KeyRow value={newApiKey} onCopy={copyKey} copied={copied} highlight />
          </div>
        )}

        {/* Revealed existing key */}
        {!newApiKey && revealedKey && (
          <div className="mb-4">
            <KeyRow value={revealedKey} onCopy={copyKey} copied={copied} />
          </div>
        )}

        {/* Hidden state */}
        {!newApiKey && !revealedKey && (
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-mono" style={{ color: "rgba(14,165,233,0.4)" }}>
              x-api-key: rck_••••••••••••••••••••••••••••••••••••••••••••••••
            </div>
            <button
              onClick={revealKey}
              disabled={revealing}
              className="hud-btn px-3 py-1.5 text-xs rounded flex-shrink-0 ml-3"
              style={{ color: "#38bdf8" }}
            >
              {revealing ? "..." : "👁 REVEAL"}
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={regenerateKey}
            disabled={regenerating}
            className="hud-btn hud-btn-danger px-3 py-1.5 text-xs rounded"
          >
            {regenerating ? "..." : "↺ REGENERATE KEY"}
          </button>
        </div>
      </HudCard>

      {/* Targets */}
      <HudCard corners label="RELAY TARGETS">
        <div className="space-y-2">
          {route.targets.map((target, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded"
              style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.12)" }}
            >
              <span style={{ color: "#67e8f9", fontSize: "16px" }}>⊕</span>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
                  {target.chatName ?? `Chat ${target.chatId}`}
                </div>
                <div className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>
                  Chat ID: {target.chatId}
                </div>
              </div>
              <div className="text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(14,165,233,0.08)", color: "#38bdf8" }}>
                bot:{target.botId.substring(0, 8)}...
              </div>
            </div>
          ))}
        </div>
      </HudCard>

      {/* Endpoint docs */}
      <HudCard corners label="ENDPOINT DOCUMENTATION">
        <div className="space-y-4 text-xs">
          <Section label="REQUEST">
            <pre
              className="p-3 rounded overflow-x-auto"
              style={{ background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.1)", color: "#94a3b8" }}
            >
              <code>{`POST /api/r/${slug}
x-api-key: <your-api-key>
Content-Type: application/json

{
  "title": "string (optional)",
  "message": "string (optional)",
  "payload": { } (optional),
  "level": "info|success|warning|error"
}`}</code>
            </pre>
          </Section>

          <Section label="CURL EXAMPLE">
            <pre
              className="p-3 rounded overflow-x-auto"
              style={{ background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.1)", color: "#94a3b8" }}
            >
              <code>{`curl -X POST \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Deploy successful",
    "message": "v2.1.0 deployed to production",
    "level": "success",
    "payload": { "version": "2.1.0" }
  }' \\
  ${origin}/api/r/${slug}`}</code>
            </pre>
          </Section>

          <Section label="JAVASCRIPT FETCH">
            <pre
              className="p-3 rounded overflow-x-auto"
              style={{ background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.1)", color: "#94a3b8" }}
            >
              <code>{`await fetch("${origin}/api/r/${slug}", {
  method: "POST",
  headers: {
    "x-api-key": process.env.RELAY_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Alert",
    level: "error",
    message: "Something went wrong",
  }),
});`}</code>
            </pre>
          </Section>
        </div>
      </HudCard>

      {/* Recent events */}
      {events.length > 0 && (
        <HudCard corners label="RECENT EVENTS">
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-2 rounded text-xs"
                style={{ background: "rgba(14,165,233,0.03)", border: "1px solid rgba(14,165,233,0.07)" }}
              >
                <span className={`badge badge-${event.level}`}>{event.level}</span>
                <div className="flex-1">
                  <div className="font-semibold mb-0.5" style={{ color: "#e2e8f0" }}>{event.title ?? "Event"}</div>
                  {event.message && <div style={{ color: "rgba(148,163,184,0.6)" }}>{event.message}</div>}
                  <div className="flex gap-1 mt-1">
                    {event.deliveries.map((d, j) => (
                      <span
                        key={j}
                        style={{
                          fontSize: "9px",
                          color: d.success ? "#6ee7b7" : "#fca5a5",
                        }}
                      >
                        {d.success ? "✓" : "✗"} {d.chatId}
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{ color: "rgba(148,163,184,0.4)" }}>{timeAgo(event.timestamp)}</span>
              </div>
            ))}
          </div>
        </HudCard>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(14,165,233,0.6)" }}>{label}</div>
      {children}
    </div>
  );
}

function KeyRow({ value, onCopy, copied, highlight }: { value: string; onCopy: (v: string) => void; copied: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <code
        className="flex-1 text-sm px-3 py-2 rounded break-all"
        style={{
          background: highlight ? "rgba(245,158,11,0.05)" : "rgba(14,165,233,0.05)",
          border: `1px solid ${highlight ? "rgba(245,158,11,0.25)" : "rgba(14,165,233,0.2)"}`,
          color: highlight ? "#fcd34d" : "#38bdf8",
        }}
      >
        {value}
      </code>
      <button onClick={() => onCopy(value)} className="hud-btn px-3 py-2 text-xs rounded flex-shrink-0">
        {copied ? "✓ COPIED" : "COPY"}
      </button>
    </div>
  );
}
