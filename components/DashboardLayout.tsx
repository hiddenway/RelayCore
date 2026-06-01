"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GridBackground } from "./hud/GridBackground";

const NAV_ITEMS = [
  { href: "/dashboard", label: "CORE STATUS", icon: "◈" },
  { href: "/routes", label: "ROUTES", icon: "⟁" },
  { href: "/bots", label: "BOT NETWORK", icon: "⊕" },
  { href: "/logs", label: "EVENT STREAM", icon: "≡" },
  { href: "/settings", label: "SETTINGS", icon: "⚙" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen flex" style={{ background: "#020817" }}>
      <GridBackground />

      {/* Sidebar */}
      <aside
        className="relative z-10 flex flex-col w-56 min-h-screen flex-shrink-0"
        style={{ borderRight: "1px solid rgba(14,165,233,0.1)" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-4"
          style={{ borderBottom: "1px solid rgba(14,165,233,0.1)" }}
        >
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{
              background: "radial-gradient(circle, rgba(14,165,233,0.3) 0%, rgba(2,8,23,0.9) 70%)",
              border: "1px solid rgba(14,165,233,0.4)",
              boxShadow: "0 0 10px rgba(14,165,233,0.2)",
            }}
          >
            <span style={{ color: "#38bdf8", fontSize: "14px" }}>◈</span>
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide" style={{ color: "#e2e8f0" }}>
              <span style={{ color: "#38bdf8" }} className="text-glow">Relay</span>Core
            </div>
            <div className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(14,165,233,0.4)" }}>
              CONTROL PANEL
            </div>
          </div>
        </div>

        {/* System status */}
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{ borderBottom: "1px solid rgba(14,165,233,0.07)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full status-dot" style={{ background: "#10b981", boxShadow: "0 0 5px #10b981" }} />
          <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(16,185,129,0.7)" }}>
            SYSTEM ONLINE
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 text-xs transition-all duration-200 relative group"
                style={{
                  color: active ? "#38bdf8" : "rgba(148,163,184,0.6)",
                  background: active ? "rgba(14,165,233,0.07)" : "transparent",
                  borderRight: active ? "2px solid rgba(14,165,233,0.6)" : "2px solid transparent",
                  fontWeight: active ? 700 : 400,
                  letterSpacing: "0.1em",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0"
                    style={{ background: "rgba(14,165,233,0.05)" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10" style={{ fontSize: "13px" }}>{item.icon}</span>
                <span className="relative z-10 tracking-widest">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(14,165,233,0.1)" }} className="p-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="hud-btn w-full py-2 text-xs font-bold tracking-widest uppercase rounded"
          >
            {loggingOut ? "..." : "⏻ LOGOUT"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
