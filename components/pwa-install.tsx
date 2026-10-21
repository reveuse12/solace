"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaInstall() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    const onInstall = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
    window.addEventListener("beforeinstallprompt", onInstall);
    navigator.serviceWorker?.addEventListener("controllerchange", () => setUpdateReady(true));
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);
  if (!installEvent && !updateReady) return null;
  return <div className="fixed bottom-5 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-4 rounded-2xl border border-[#d9d0c6] bg-[#fbf8f4] px-4 py-3 text-xs shadow-lg"><span>{updateReady ? "A new Solace version is ready." : "Keep Solace close on your home screen."}</span>{updateReady ? <button onClick={() => window.location.reload()} className="rounded-full bg-[#252321] px-3 py-2 text-[#f4eee8]">Refresh</button> : <button onClick={async () => { await installEvent?.prompt(); setInstallEvent(null); }} className="rounded-full bg-[#252321] px-3 py-2 text-[#f4eee8]">Install</button>}</div>;
}
