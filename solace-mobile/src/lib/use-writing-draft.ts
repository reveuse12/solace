import { useEffect, useMemo, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { useWorkspace } from "./workspace";
import { createWritingDraftStore, type WritingDraft } from "./writing-draft";
const fresh = (): WritingDraft => ({ version: 1, clientId: Crypto.randomUUID(), body: "", title: "", prompt: "", editing: null });
export function useWritingDraft(name: string) {
  const { userId } = useWorkspace();
  const store = useMemo(() => createWritingDraftStore(SecureStore, userId, name), [userId, name]);
  const mounted = useRef(true); const saving = useRef(false); const [busy, setBusy] = useState(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [value, setValue] = useState(fresh); const [ready, setReady] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    void store.load().then(saved => { if (live) { setValue(saved || fresh()); setReady(true); } }).catch(() => { if (live) setError("Your writing draft couldn't be opened. Please retry."); });
    return () => { live = false; };
  }, [store]);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    void store.save(value).then(() => { if (live) setError(""); }).catch(() => { if (live) setError("Your words are still here, but couldn't be saved on this phone. Retry before closing Solace."); });
    return () => { live = false; };
  }, [ready, store, value]);
  function change(patch: Partial<Omit<WritingDraft, "version" | "clientId">>) {
    if (saving.current) return;
    const clientId = Crypto.randomUUID();
    setValue(current => {
      const next = { ...current, ...patch };
      const changed = next.body.trim() !== current.body.trim() || next.title.trim() !== current.title.trim() || next.prompt !== current.prompt || next.editing !== current.editing;
      return { ...next, clientId: changed ? clientId : current.clientId };
    });
  }
  async function reset() { await store.clear(); setValue(fresh()); }
  async function retry() {
    try {
      if (!ready) { const saved = await store.load(); setValue(saved || fresh()); setReady(true); }
      else await store.save(value);
      setError("");
    } catch { setError("Your draft is still unavailable. Your saved account data hasn't changed."); }
  }
  async function submit(save: (snapshot: WritingDraft) => Promise<unknown>) {
    if (!ready) throw new Error("Wait for your draft to load.");
    if (saving.current) return;
    saving.current = true; setBusy(true);
    const snapshot = value;
    try {
      await store.save(snapshot); await save(snapshot);
      await store.clearIf(current => current.clientId === snapshot.clientId);
      if (mounted.current) setValue(current => current.clientId === snapshot.clientId ? fresh() : current);
    } finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  return { value, ready, busy, error, change, reset, retry, submit };
}
