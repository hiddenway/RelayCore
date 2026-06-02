"use client";

import { HudCard } from "./hud/HudCard";

const ENV_VARS = [
  { key: "KV_REST_API_URL", desc: "Vercel KV REST URL (or UPSTASH_REDIS_REST_URL)", from: "Vercel KV" },
  { key: "KV_REST_API_TOKEN", desc: "Vercel KV REST token (or UPSTASH_REDIS_REST_TOKEN)", from: "Vercel KV" },
  { key: "APP_SECRET", desc: "Encryption & session secret (32+ chars)", from: "Manual" },
  { key: "SETUP_PASSWORD", desc: "One-time setup access token", from: "Manual" },
];

const DATA_MODEL = [
  { key: "app:setup_completed", desc: "Setup state flag" },
  { key: "app:admin", desc: "Admin account (username + password hash)" },
  { key: "bots:index", desc: "Array of bot IDs" },
  { key: "bot:{botId}", desc: "Bot data (token encrypted)" },
  { key: "routes:index", desc: "Array of route slugs" },
  { key: "route:{slug}", desc: "Route config + targets + API key hash" },
  { key: "events:recent", desc: "Last 100 events (global)" },
  { key: "events:route:{slug}", desc: "Last 50 events per route" },
  { key: "stats:total", desc: "All-time delivery stats" },
  { key: "stats:today:{YYYY-MM-DD}", desc: "Daily stats (7-day TTL)" },
  { key: "stats:route:{slug}", desc: "Per-route delivery stats" },
];

export function SettingsPanel() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
        <h1 className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "rgba(56,189,248,0.6)" }}>
          SYSTEM SETTINGS
        </h1>
        <div className="flex-1 h-px" style={{ background: "rgba(56,189,248,0.1)" }} />
      </div>

      {/* Environment variables */}
      <HudCard corners label="ENVIRONMENT VARIABLES">
        <p className="text-xs mb-4" style={{ color: "rgba(148,163,184,0.6)" }}>
          All configuration is set via Vercel environment variables. Never store secrets in code.
        </p>
        <table className="hud-table">
          <thead>
            <tr>
              <th>VARIABLE</th>
              <th>DESCRIPTION</th>
              <th>SOURCE</th>
            </tr>
          </thead>
          <tbody>
            {ENV_VARS.map((v) => (
              <tr key={v.key}>
                <td>
                  <code className="text-xs" style={{ color: "#38bdf8" }}>{v.key}</code>
                </td>
                <td style={{ color: "#94a3b8" }}>{v.desc}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: v.from === "Vercel Storage" ? "rgba(56,189,248,0.1)" : "rgba(16,185,129,0.1)",
                      color: v.from === "Vercel Storage" ? "#38bdf8" : "#6ee7b7",
                      border: `1px solid ${v.from === "Vercel Storage" ? "rgba(56,189,248,0.2)" : "rgba(16,185,129,0.2)"}`,
                    }}
                  >
                    {v.from}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </HudCard>

      {/* Redis data model */}
      <HudCard corners label="REDIS DATA MODEL">
        <p className="text-xs mb-4" style={{ color: "rgba(148,163,184,0.6)" }}>
          All application data is stored in Upstash Redis using the following key schema.
        </p>
        <table className="hud-table">
          <thead>
            <tr>
              <th>KEY PATTERN</th>
              <th>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {DATA_MODEL.map((item) => (
              <tr key={item.key}>
                <td>
                  <code className="text-xs" style={{ color: "#67e8f9" }}>{item.key}</code>
                </td>
                <td style={{ color: "#94a3b8" }}>{item.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </HudCard>

      {/* Security */}
      <HudCard corners label="SECURITY MODEL">
        <ul className="space-y-2 text-xs" style={{ color: "#94a3b8" }}>
          {[
            "Telegram bot tokens are AES-256-GCM encrypted using APP_SECRET",
            "Admin passwords are hashed with bcrypt (cost factor 12)",
            "Route API keys are hashed with bcrypt and shown only once on creation",
            "Panel sessions use HS256 JWT signed with APP_SECRET, stored in httpOnly cookies",
            "Dashboard routes are protected by Next.js middleware",
            "Setup endpoint is disabled after setup_completed is set",
            "Rate limiting: 60 requests/min per route (in-memory, resets on cold start)",
            "Raw Telegram tokens are never exposed through any API endpoint",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span style={{ color: "#38bdf8", flexShrink: 0 }}>▸</span>
              {item}
            </li>
          ))}
        </ul>
      </HudCard>

      {/* Version info */}
      <div className="flex items-center justify-between text-[10px] tracking-widest uppercase" style={{ color: "rgba(56,189,248,0.25)" }}>
        <span>RELAY CORE v1.0</span>
        <span>NEXT.JS 15 · UPSTASH REDIS · VERCEL</span>
      </div>
    </div>
  );
}
