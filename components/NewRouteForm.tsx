"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HudCard } from "./hud/HudCard";
import { slugify } from "@/lib/utils";
import type { TelegramBot } from "@/types";

interface Target {
  botId: string;
  chatId: string;
  chatName: string;
}

export function NewRouteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targets, setTargets] = useState<Target[]>([{ botId: "", chatId: "", chatName: "" }]);
  const [bots, setBots] = useState<Omit<TelegramBot, "tokenEncrypted">[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bots").then((r) => r.json()).then((d) => setBots(d.bots ?? []));
  }, []);

  function addTarget() {
    setTargets([...targets, { botId: "", chatId: "", chatName: "" }]);
  }

  function removeTarget(i: number) {
    setTargets(targets.filter((_, j) => j !== i));
  }

  function updateTarget(i: number, key: keyof Target, val: string) {
    setTargets(targets.map((t, j) => j === i ? { ...t, [key]: val } : t));
  }

  async function handleSubmit() {
    setError("");
    const validTargets = targets.filter((t) => t.botId && t.chatId);
    if (!name) { setError("Route name is required"); return; }
    if (validTargets.length === 0) { setError("At least one target is required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, targets: validTargets }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to create route"); return; }
      setNewApiKey(json.apiKey);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (newApiKey) {
    const slug = slugify(name);
    return (
      <div className="max-w-lg">
        <HudCard glow corners label="ROUTE CREATED">
          <div className="text-center py-4 mb-4">
            <div className="text-2xl mb-2">✓</div>
            <h2 className="text-base font-bold" style={{ color: "#6ee7b7" }}>Route Created Successfully</h2>
          </div>
          <div className="space-y-4">
            <InfoBlock label="ENDPOINT" value={`/api/r/${slug}`} />
            <InfoBlock label="API KEY (save this — shown once)" value={newApiKey} copyable warning />
            <CurlBlock slug={slug} apiKey={newApiKey} />
          </div>
          <button
            onClick={() => router.push("/routes")}
            className="hud-btn hud-btn-primary w-full py-2.5 text-sm font-bold tracking-wider rounded mt-4"
          >
            VIEW ALL ROUTES →
          </button>
        </HudCard>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(14,165,233,0.1)" }} />
        <h1 className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "rgba(14,165,233,0.6)" }}>
          NEW ROUTE
        </h1>
        <div className="flex-1 h-px" style={{ background: "rgba(14,165,233,0.1)" }} />
      </div>

      <HudCard corners>
        <div className="space-y-4">
          <Field label="ROUTE NAME" value={name} onChange={setName} placeholder="My App Alerts" />
          {name && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs" style={{ color: "rgba(14,165,233,0.6)" }}>
              Endpoint: <code style={{ color: "#38bdf8" }}>/api/r/{slugify(name)}</code>
            </motion.div>
          )}
          <Field label="DESCRIPTION (optional)" value={description} onChange={setDescription} placeholder="Alerts from production backend" />
        </div>
      </HudCard>

      <HudCard corners label="RELAY TARGETS">
        <div className="space-y-3 mb-3">
          {targets.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded space-y-2"
              style={{ background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.1)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(14,165,233,0.6)" }}>
                  TARGET {i + 1}
                </span>
                {targets.length > 1 && (
                  <button onClick={() => removeTarget(i)} className="hud-btn hud-btn-danger px-2 py-0.5 text-xs rounded">
                    REMOVE
                  </button>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(14,165,233,0.5)" }}>
                  BOT
                </label>
                <select
                  value={t.botId}
                  onChange={(e) => updateTarget(i, "botId", e.target.value)}
                  className="hud-input w-full px-3 py-2 text-sm rounded"
                >
                  <option value="">Select a bot...</option>
                  {bots.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.username ? `(@${b.username})` : ""} {b.enabled ? "" : "[DISABLED]"}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="CHAT ID" value={t.chatId} onChange={(v) => updateTarget(i, "chatId", v)} placeholder="-1001234567890" />
              <Field label="CHAT NAME (optional)" value={t.chatName} onChange={(v) => updateTarget(i, "chatName", v)} placeholder="Production Alerts" />
            </motion.div>
          ))}
        </div>

        <button onClick={addTarget} className="hud-btn w-full py-2 text-xs font-bold tracking-wider rounded">
          + ADD TARGET
        </button>
      </HudCard>

      {error && (
        <div className="p-3 rounded text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          ⚠ {error}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => router.push("/routes")} className="hud-btn flex-1 py-2.5 text-sm font-bold tracking-wider rounded">
          CANCEL
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="hud-btn hud-btn-primary flex-1 py-2.5 text-sm font-bold tracking-wider rounded"
        >
          {loading ? "CREATING..." : "CREATE ROUTE →"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(14,165,233,0.7)" }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="hud-input w-full px-3 py-2 text-sm rounded"
      />
    </div>
  );
}

function InfoBlock({ label, value, copyable, warning }: { label: string; value: string; copyable?: boolean; warning?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: warning ? "rgba(245,158,11,0.8)" : "rgba(14,165,233,0.6)" }}>
        {label}
      </div>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 text-xs px-2 py-1.5 rounded break-all"
          style={{
            background: warning ? "rgba(245,158,11,0.05)" : "rgba(14,165,233,0.05)",
            border: `1px solid ${warning ? "rgba(245,158,11,0.2)" : "rgba(14,165,233,0.1)"}`,
            color: warning ? "#fcd34d" : "#38bdf8",
          }}
        >
          {value}
        </code>
        {copyable && (
          <button
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="hud-btn px-2 py-1 text-xs flex-shrink-0 rounded"
          >
            {copied ? "✓" : "COPY"}
          </button>
        )}
      </div>
    </div>
  );
}

function CurlBlock({ slug, apiKey }: { slug: string; apiKey: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(14,165,233,0.6)" }}>
        CURL EXAMPLE
      </div>
      <pre
        className="text-xs p-3 rounded overflow-x-auto"
        style={{ background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.1)", color: "#94a3b8" }}
      >
        <code>{`curl -X POST \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Alert","level":"error"}' \\
  https://your-app.vercel.app/api/r/${slug}`}</code>
      </pre>
    </div>
  );
}
