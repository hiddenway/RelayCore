"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GridBackground } from "./hud/GridBackground";
import { HolographicRings } from "./hud/HolographicRings";

type Step = "token" | "admin" | "bot" | "route" | "test" | "done";

interface SetupData {
  setupToken: string;
  username: string;
  password: string;
  botToken: string;
  botName: string;
  botChatId: string;
  botThreadId: string;
  routeName: string;
}

interface SetupResult {
  routeSlug: string;
  apiKey: string;
}

const STEPS: Step[] = ["token", "admin", "bot", "route", "test", "done"];
const STEP_LABELS: Record<Step, string> = {
  token: "SETUP PASSWORD",
  admin: "ADMIN ACCOUNT",
  bot: "TELEGRAM BOT",
  route: "FIRST ROUTE",
  test: "TEST EVENT",
  done: "COMPLETE",
};

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("token");
  const [data, setData] = useState<Partial<SetupData>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const currentIndex = STEPS.indexOf(step);

  function update(key: keyof SetupData, value: string) {
    setData((d) => ({ ...d, [key]: value }));
    setError("");
  }

  async function handleSubmitSetup() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Setup failed");
        return;
      }
      setResult({ routeSlug: json.routeSlug, apiKey: json.apiKey });
      setStep("test");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleTestEvent() {
    if (!result) return;
    setLoading(true);
    try {
      const res = await fetch("/api/test-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeSlug: result.routeSlug }),
      });
      const json = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, message: `Event delivered to ${json.deliveries?.filter((d: {success:boolean}) => d.success).length ?? 0} target(s).` });
        setStep("done");
      } else {
        setTestResult({ ok: false, message: json.error ?? "Test failed" });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "#020817" }}>
      <GridBackground />

      <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold tracking-wider mb-1" style={{ color: "#e2e8f0" }}>
              <span style={{ color: "#38bdf8" }} className="text-glow">Relay</span>Core
            </h1>
            <p className="text-xs tracking-[0.25em] uppercase" style={{ color: "rgba(14,165,233,0.6)" }}>
              INITIALIZATION WIZARD
            </p>
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className="flex-1 h-px transition-all duration-500"
                style={{
                  background: i <= currentIndex ? "rgba(14,165,233,0.7)" : "rgba(14,165,233,0.15)",
                  boxShadow: i <= currentIndex ? "0 0 6px rgba(14,165,233,0.5)" : "none",
                }}
              />
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300"
                style={{
                  background: i < currentIndex ? "#0ea5e9" : i === currentIndex ? "#38bdf8" : "rgba(14,165,233,0.2)",
                  boxShadow: i === currentIndex ? "0 0 8px rgba(56,189,248,0.8)" : i < currentIndex ? "0 0 4px rgba(14,165,233,0.5)" : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Step label */}
        <div className="flex items-center gap-2 mb-6">
          <div className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(14,165,233,0.6)" }}>
            STEP {currentIndex + 1} / {STEPS.length}
          </div>
          <div className="flex-1 h-px" style={{ background: "rgba(14,165,233,0.1)" }} />
          <div className="text-xs font-bold tracking-widest uppercase" style={{ color: "#38bdf8" }}>
            {STEP_LABELS[step]}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="glass-card rounded-lg p-6"
            style={{ border: "1px solid rgba(14,165,233,0.15)" }}
          >
            {step === "token" && (
              <StepSection
                title="Enter Setup Password"
                desc="Enter the SETUP_TOKEN value you set in your Vercel environment variables. This is a one-time password to protect the setup process."
              >
                <Field label="SETUP PASSWORD" type="password" value={data.setupToken ?? ""} onChange={(v) => update("setupToken", v)} placeholder="Enter your setup password" />
                <Btn loading={loading} onClick={async () => {
                  if (!data.setupToken) { setError("Setup password is required"); return; }
                  setLoading(true);
                  setError("");
                  try {
                    const res = await fetch("/api/setup/verify-token", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ token: data.setupToken }),
                    });
                    const json = await res.json();
                    if (!res.ok) { setError(json.error ?? "Invalid setup password"); return; }
                    nextStep();
                  } catch {
                    setError("Network error");
                  } finally {
                    setLoading(false);
                  }
                }}>CONTINUE →</Btn>
              </StepSection>
            )}

            {step === "admin" && (
              <StepSection title="Create Admin Account" desc="This will be your panel login credentials.">
                <Field label="USERNAME" value={data.username ?? ""} onChange={(v) => update("username", v)} placeholder="admin" />
                <Field label="PASSWORD" type="password" value={data.password ?? ""} onChange={(v) => update("password", v)} placeholder="Min 8 characters" />
                <Btn loading={loading} onClick={() => {
                  if (!data.username || data.username.length < 3) { setError("Username must be at least 3 characters"); return; }
                  if (!data.password || data.password.length < 8) { setError("Password must be at least 8 characters"); return; }
                  nextStep();
                }}>CONTINUE →</Btn>
              </StepSection>
            )}

            {step === "bot" && (
              <StepSection title="Connect Telegram Bot" desc="Create a bot via @BotFather and paste the token here.">
                <Field label="BOT NAME" value={data.botName ?? ""} onChange={(v) => update("botName", v)} placeholder="My Alert Bot" />
                <Field label="BOT TOKEN" type="password" value={data.botToken ?? ""} onChange={(v) => update("botToken", v)} placeholder="123456:ABCdef..." />
                <Field label="CHAT ID" value={data.botChatId ?? ""} onChange={(v) => update("botChatId", v)} placeholder="-1001234567890" />
                <Field label="TOPIC / THREAD ID (optional, for forum groups)" value={data.botThreadId ?? ""} onChange={(v) => update("botThreadId", v)} placeholder="2" />
                <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.6)" }}>
                  Regular chat: just Chat ID. Forum group: Chat ID + Topic ID from t.me/c/GROUP/<strong>TOPIC</strong>
                </p>
                <Btn loading={loading} onClick={() => {
                  if (!data.botName || !data.botToken || !data.botChatId) { setError("All bot fields are required"); return; }
                  nextStep();
                }}>CONTINUE →</Btn>
              </StepSection>
            )}

            {step === "route" && (
              <StepSection title="Create First Route" desc="Routes are endpoints that receive events and relay them to your bots.">
                <Field label="ROUTE NAME" value={data.routeName ?? ""} onChange={(v) => update("routeName", v)} placeholder="My App Alerts" />
                <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.6)" }}>
                  Slug will be auto-generated. Endpoint: <code className="text-sky-400">/api/r/my-app-alerts</code>
                </p>
                <Btn loading={loading} onClick={async () => {
                  if (!data.routeName) { setError("Route name is required"); return; }
                  await handleSubmitSetup();
                }}>CREATE &amp; FINALIZE →</Btn>
              </StepSection>
            )}

            {step === "test" && result && (
              <StepSection title="Send Test Event" desc="Let's verify everything works end-to-end.">
                <div className="space-y-2 mb-4">
                  <InfoRow label="ROUTE ENDPOINT" value={`/api/r/${result.routeSlug}`} mono />
                  <InfoRow label="API KEY (save this!)" value={result.apiKey} mono copyable />
                </div>
                <div
                  className="p-3 rounded text-xs font-mono mb-4"
                  style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.1)", color: "#94a3b8" }}
                >
                  <div style={{ color: "rgba(14,165,233,0.6)" }}># Test with curl</div>
                  <div>curl -X POST \</div>
                  <div style={{ paddingLeft: "12px" }}>-H &quot;x-api-key: {result.apiKey}&quot; \</div>
                  <div style={{ paddingLeft: "12px" }}>-H &quot;Content-Type: application/json&quot; \</div>
                  <div style={{ paddingLeft: "12px" }}>-d &apos;{`{"title":"Hello","level":"success"}`}&apos; \</div>
                  <div style={{ paddingLeft: "12px" }}>https://your-app.vercel.app/api/r/{result.routeSlug}</div>
                </div>
                {testResult && (
                  <div
                    className="p-3 rounded text-sm mb-4"
                    style={{
                      background: testResult.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      border: `1px solid ${testResult.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                      color: testResult.ok ? "#6ee7b7" : "#fca5a5",
                    }}
                  >
                    {testResult.ok ? "✓ " : "✗ "}{testResult.message}
                  </div>
                )}
                <Btn loading={loading} onClick={handleTestEvent}>SEND TEST EVENT ▶</Btn>
              </StepSection>
            )}

            {step === "done" && (
              <StepSection title="Setup Complete" desc="">
                <div className="flex justify-center my-4">
                  <HolographicRings size={100} />
                </div>
                <p className="text-center text-sm mb-6" style={{ color: "#94a3b8" }}>
                  RelayCore is now active. Your control panel is ready.
                </p>
                <Btn loading={false} onClick={() => router.push("/dashboard")}>
                  ENTER CONTROL PANEL →
                </Btn>
              </StepSection>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded text-xs"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
              >
                ⚠ {error}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="mt-4 text-center text-xs tracking-widest uppercase" style={{ color: "rgba(14,165,233,0.25)" }}>
          RELAY CORE v1.0 · SECURE INITIALIZATION CHANNEL
        </p>
      </div>
    </div>
  );
}

function StepSection({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold mb-1 tracking-wide" style={{ color: "#e2e8f0" }}>{title}</h2>
      {desc && <p className="text-xs mb-5" style={{ color: "rgba(148,163,184,0.7)" }}>{desc}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(14,165,233,0.7)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="hud-input w-full px-3 py-2 text-sm rounded"
      />
    </div>
  );
}

function Btn({ children, onClick, loading }: { children: React.ReactNode; onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="hud-btn hud-btn-primary w-full py-2.5 px-4 text-sm font-bold tracking-wider mt-2 rounded"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-sky-400 border-t-transparent" style={{ animation: "spin 0.6s linear infinite" }} />
          PROCESSING...
        </span>
      ) : children}
    </button>
  );
}

function InfoRow({ label, value, mono, copyable }: { label: string; value: string; mono?: boolean; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-0.5" style={{ color: "rgba(14,165,233,0.6)" }}>{label}</div>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 text-xs px-2 py-1.5 rounded"
          style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.1)", color: "#38bdf8", wordBreak: "break-all" }}
        >
          {mono ? value : value}
        </code>
        {copyable && (
          <button onClick={copy} className="hud-btn px-2 py-1 text-xs flex-shrink-0">
            {copied ? "✓" : "COPY"}
          </button>
        )}
      </div>
    </div>
  );
}
