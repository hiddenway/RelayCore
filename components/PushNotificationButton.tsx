"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type State = "loading" | "unsupported" | "unconfigured" | "denied" | "subscribed" | "unsubscribed";

const SUB_ID_KEY = "relay_push_sub_id";

export function PushNotificationButton() {
  const [state, setState] = useState<State>("loading");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    check();
  }, []);

  async function check() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    const res = await fetch("/api/push/vapid-key");
    if (!res.ok) { setState("unconfigured"); return; }

    if (Notification.permission === "denied") { setState("denied"); return; }

    const subId = localStorage.getItem(SUB_ID_KEY);
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    setState(existing && subId ? "subscribed" : "unsubscribed");
  }

  async function subscribe() {
    setWorking(true);
    try {
      const keyRes = await fetch("/api/push/vapid-key");
      const { publicKey } = await keyRes.json();

      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("denied"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), label: navigator.userAgent.slice(0, 40) }),
      });
      const data = await saveRes.json();
      localStorage.setItem(SUB_ID_KEY, data.id);
      setState("subscribed");
    } catch (e) {
      console.error(e);
    } finally {
      setWorking(false);
    }
  }

  async function unsubscribe() {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      await sub?.unsubscribe();

      const id = localStorage.getItem(SUB_ID_KEY);
      if (id) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        localStorage.removeItem(SUB_ID_KEY);
      }
      setState("unsubscribed");
    } finally {
      setWorking(false);
    }
  }

  if (state === "loading" || state === "unsupported" || state === "unconfigured") return null;

  if (state === "denied") {
    return (
      <div className="text-[10px] px-2 py-1 rounded" style={{ color: "rgba(245,158,11,0.7)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        🔔 Notifications blocked
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={state === "subscribed" ? unsubscribe : subscribe}
      disabled={working}
      className="hud-btn px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded flex items-center gap-1.5"
      style={state === "subscribed" ? {
        color: "#6ee7b7",
        borderColor: "rgba(16,185,129,0.35)",
        background: "rgba(16,185,129,0.08)",
      } : {}}
      title={state === "subscribed" ? "Click to disable browser notifications" : "Enable browser notifications"}
    >
      {working ? (
        <span className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent" style={{ animation: "spin 0.6s linear infinite" }} />
      ) : (
        <span>{state === "subscribed" ? "🔔" : "🔕"}</span>
      )}
      {state === "subscribed" ? "NOTIFS ON" : "NOTIFS OFF"}
    </motion.button>
  );
}

