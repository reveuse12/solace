"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(async (registration) => {
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!key || !("PushManager" in window) || Notification.permission !== "granted") return;
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      }).catch(() => undefined);
    }
  }, []);

  return null;
}
