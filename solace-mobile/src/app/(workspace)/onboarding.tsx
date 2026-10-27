import { usePalette } from "../../lib/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { useWorkspace } from "../../lib/workspace";
import { focuses, profileInput, type Entry, type Reminder } from "../../lib/models";
import { createDraftStore, type OnboardingDraft } from "../../lib/onboarding-draft";
import { recordSetupEvent } from "../../lib/setup-metrics";
import { ReadAloud } from "../../components/read-aloud";
import { Body, Button, Choices, ErrorText, Field, Label, Loading, Title, s } from "../../components/ui";

const examples = ["I want more room to breathe in my day.", "I am making space for meaningful work.", "I want to feel at home in myself."];
export default function Onboarding() {
  const palette = usePalette();
  const { profile, saveProfile, userId, api, refresh, enableReminders } = useWorkspace();
  const store = useMemo(() => createDraftStore(SecureStore, userId), [userId]);
  const [draft, setDraft] = useState<OnboardingDraft>(() => ({ version: 2, step: 0, value: profileInput(profile), entry: "", savedEntry: "", reminderTime: "20:00" }));
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [storageError, setStorageError] = useState("");
  const [showReminder, setShowReminder] = useState(false); const saving = useRef(false);
  const { step, value, entry } = draft;
  useEffect(() => {
    let active = true;
    void store.load().then(saved => { if (active) { if (saved) setDraft(saved); setReady(true); } }).catch(() => { if (active) setStorageError("Your saved draft couldn't be opened. Retry before starting again."); });
    return () => { active = false; };
  }, [store]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    void store.save(draft).then(() => { if (active) setStorageError(""); }).catch(() => { if (active) setStorageError("Your draft is still on this screen, but couldn't be saved on this phone. Retry before closing Solace."); });
    void recordSetupEvent(userId, (["started", "personalize", "entry", "completed"] as const)[step]).catch(() => {});
    return () => { active = false; };
  }, [draft, ready, step, store, userId]);
  function changeValue(patch: Partial<typeof value>) { setDraft(current => ({ ...current, value: { ...current.value, ...patch } })); }
  async function save(skipEntry = false) {
    if (saving.current || !value.privacyConsent) return;
    saving.current = true; setBusy(true); setError("");
    try {
      await store.save(draft);
      // A profile must exist before its manifestation (the server enforces the foreign key).
      await saveProfile(value);
      if (skipEntry) {
        await store.clear(); await recordSetupEvent(userId, "completed").catch(() => {});
        router.replace("/(workspace)/(tabs)"); return;
      }
      let savedEntry = draft.savedEntry;
      if (!skipEntry && entry.trim()) {
        const body = entry.trim();
        if (savedEntry !== body) {
          // Recover a committed POST whose response was lost, before attempting another insert.
          const existing = await api<{ desires: Entry[] }>("/api/desires");
          if (!Array.isArray(existing.desires)) throw new Error("Couldn't check your saved entries. Please retry.");
          if (!existing.desires.some(item => item.body === body)) await api("/api/desires", { method: "POST", body: { body } });
          savedEntry = body;
          await recordSetupEvent(userId, "first_entry_saved").catch(() => {});
        }
      }
      const next = { ...draft, step: 3, savedEntry };
      // Persist the successful entry before advancing so a retry never posts it again.
      await store.save(next); setDraft(next); await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save. Your words are still here; please retry.");
      void recordSetupEvent(userId, "sync_failed").catch(() => {});
    } finally { saving.current = false; setBusy(false); }
  }
  async function finish(reminder: boolean) {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      if (reminder) {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.reminderTime)) throw new Error("Use a time such as 08:30 or 20:00.");
        const existing = await api<{ reminders: Reminder[] }>("/api/reminders");
        if (!Array.isArray(existing.reminders)) throw new Error("Couldn't check your reminders. Please retry.");
        if (!existing.reminders.some(item => item.label === "A moment for yourself" && item.time_local.slice(0, 5) === draft.reminderTime && item.enabled && item.days.length === 7)) {
          await api("/api/reminders", { method: "POST", body: { label: "A moment for yourself", timeLocal: draft.reminderTime, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, days: [0, 1, 2, 3, 4, 5, 6] } });
        }
        await refresh();
        // Only ask the phone for permission after the user explicitly chooses a reminder.
        await enableReminders();
      }
      await store.clear(); await recordSetupEvent(userId, "completed").catch(() => {});
      router.replace("/(workspace)/(tabs)");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Couldn't finish. Try again or choose Not now."); }
    finally { saving.current = false; setBusy(false); }
  }
  if (!ready) return storageError ? <View style={s.content}><ErrorText>{storageError}</ErrorText><Button onPress={() => { void store.load().then(saved => { if (saved) setDraft(saved); setStorageError(""); setReady(true); }).catch(() => setStorageError("The draft is still unavailable. Your saved data hasn't been changed.")); }}>Retry draft</Button><Button quiet onPress={() => { void store.clear().then(() => { setStorageError(""); setReady(true); }); }}>Discard setup draft</Button></View> : <Loading />;
  return <SafeAreaView style={[s.page, { backgroundColor: palette.pink }]}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { flexGrow: 1, justifyContent: "space-between" }]}>
    <View style={s.row}><Label>solace</Label><Label>{step < 3 ? `Step ${step + 1} of 3` : "Your space is ready"}</Label></View>
    <View style={[s.gap, { gap: 24, paddingVertical: 24 }]}>
      {step === 0 ? <><Title>A little space for what matters.</Title><Body>Write one thing you want more of in your life. You can personalize the rest whenever you like.</Body><Body>Your saved entries and profile are stored online with your Solace account. Unfinished setup drafts are stored securely on this phone. You can export your account data or delete your account in Profile.</Body><Button quiet onPress={() => { void WebBrowser.openBrowserAsync(`${process.env.EXPO_PUBLIC_API_URL}/privacy`); }}>Read the Privacy Policy</Button><View style={s.row}><Body>I agree to my information being processed to provide and personalize Solace.</Body><Switch accessibilityLabel="Agree to privacy terms" value={value.privacyConsent} onValueChange={privacyConsent => changeValue({ privacyConsent })} /></View></> : null}
      {step === 1 ? <><Title>Make this space yours.</Title><Body>Both answers are optional. You can change them in Profile.</Body><Field label="Name (optional)" value={value.displayName} onChange={displayName => changeValue({ displayName })} maxLength={120} /><Label>What would you like more of? (optional)</Label><Choices items={focuses} value={value.focus} onChange={focus => changeValue({ focus: value.focus === focus ? "" : focus })} /></> : null}
      {step === 2 ? <><Title>What would you like more of in your life?</Title><Body>A sentence is enough. Start with your own words or edit an example below.</Body><Field label="Your first manifestation" value={entry} onChange={entry => setDraft(current => ({ ...current, entry, savedEntry: "" }))} maxLength={1000} multiline placeholder="I am making space for…" /><Choices items={examples} value={entry} onChange={entry => setDraft(current => ({ ...current, entry, savedEntry: "" }))} /><Button quiet onPress={() => setDraft(current => ({ ...current, entry: "", savedEntry: "" }))}>Write my own</Button></> : null}
      {step === 3 ? <><Title>{draft.savedEntry ? "Your first words are saved." : "There is room to begin whenever you like."}</Title>{draft.savedEntry ? <><Body>{draft.savedEntry}</Body><ReadAloud id="onboarding:first-entry" text={draft.savedEntry} /></> : null}<Body>Would a gentle daily reminder help? You can change it in Library.</Body>{showReminder ? <><Field label="Daily reminder time (24-hour HH:MM)" value={draft.reminderTime} onChange={reminderTime => setDraft(current => ({ ...current, reminderTime }))} maxLength={5} keyboardType="numbers-and-punctuation" /><Button disabled={busy} onPress={() => { void finish(true); }}>Save reminder & enable notifications</Button></> : <Button quiet disabled={busy} onPress={() => setShowReminder(true)}>Set a reminder</Button>}<Button quiet disabled={busy} onPress={() => { void finish(false); }}>Not now · Open my space</Button></> : null}
    </View>
    {storageError ? <><ErrorText>{storageError}</ErrorText><Button quiet disabled={busy} onPress={() => { void store.save(draft).then(() => setStorageError("")).catch(() => setStorageError("Couldn't save this draft. Keep Solace open and try again.")); }}>Retry saving draft</Button></> : null}
    {error ? <ErrorText>{error}</ErrorText> : null}
    {step < 3 ? <View style={s.gap}>{step > 0 ? <Button quiet disabled={busy} onPress={() => setDraft(current => ({ ...current, step: current.step - 1 }))}>Back</Button> : null}{step === 1 ? <Button quiet disabled={busy} onPress={() => setDraft(current => ({ ...current, step: 2 }))}>Skip for now</Button> : null}<Button disabled={busy || !value.privacyConsent || (step === 2 && !entry.trim())} onPress={() => { if (step < 2) setDraft(current => ({ ...current, step: current.step + 1 })); else void save(); }}>{busy ? "Saving your space…" : step === 2 ? "Save my first manifestation" : "Continue"}</Button>{step === 2 ? <Button quiet disabled={busy} onPress={() => { void save(true); }}>I’ll write later</Button> : null}</View> : null}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
