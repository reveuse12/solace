import { clearWritingDrafts } from "../../../lib/writing-draft";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createDraftStore } from "../../../lib/onboarding-draft";
import { readSetupMetrics } from "../../../lib/setup-metrics";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Share, Switch, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useWorkspace } from "../../../lib/workspace";
import { focuses, practiceTimes, profileInput } from "../../../lib/models";
import { chooseBackup, exportAccount } from "../../../lib/account-files";
import { Action, Body, Button, Card, Choices, Field, Label, Screen, s } from "../../../components/ui";
export default function ProfileScreen() {
  const { userId, profile, saveProfile, theme, setTheme, signOut, api, refresh, notify } = useWorkspace();
  const [draft, setDraft] = useState(() => profileInput(profile)); const [editing, setEditing] = useState(false);
  const [backup, setBackup] = useState<Awaited<ReturnType<typeof chooseBackup>>>(null);
  function beginEdit() { setDraft(profileInput(profile)); setEditing(true); }
  function deleteAccount() {
    Alert.alert("Delete your account permanently?", "This removes your Solace data and sign-in account. This cannot be undone.", [{ text: "Keep my account", style: "cancel" }, { text: "Delete permanently", style: "destructive", onPress: () => { void api("/api/account/data", { method: "DELETE" }).then(async () => { await createDraftStore(SecureStore, userId).clear(); await clearWritingDrafts(SecureStore, userId); await AsyncStorage.removeItem(`solace:${userId}:setup-metrics-v1`); await signOut(); }).catch((error) => Alert.alert("Account deletion needs attention", error.message)); } }]);
  }
  return <Screen label="Your space" title={profile?.display_name || "Profile & settings"}>
    <Card>{profile?.avatar_url && /^https:\/\//.test(profile.avatar_url) ? <Image alt="Profile photo" accessibilityLabel="Profile photo" source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80, borderRadius: 40 }} /> : null}<Body>{profile?.location}</Body><Body>{profile?.focus} · {profile?.practice_time}</Body><Label>{profile?.privacy_consent_at ? "Privacy consent saved" : "Privacy consent required"}</Label><Button onPress={beginEdit}>Edit profile & answers</Button></Card>
    {editing ? <Card><Field label="Display name (optional)" value={draft.displayName} onChange={(displayName) => setDraft({ ...draft, displayName })} maxLength={120} /><Field label="City or region (optional)" value={draft.location} onChange={(location) => setDraft({ ...draft, location })} maxLength={120} /><Label>Your focus (optional)</Label><Choices items={focuses} value={draft.focus} onChange={(focus) => setDraft({ ...draft, focus: draft.focus === focus ? "" : focus })} /><Label>Practice time (optional)</Label><Choices items={practiceTimes} value={draft.practiceTime} onChange={(practiceTime) => setDraft({ ...draft, practiceTime: draft.practiceTime === practiceTime ? "" : practiceTime })} /><Field label="Profile image URL (HTTPS)" value={draft.avatarUrl || ""} onChange={(avatarUrl) => setDraft({ ...draft, avatarUrl })} maxLength={500} keyboardType="url" /><View style={s.row}><Body>I accept the privacy terms</Body><Switch accessibilityLabel="Accept privacy terms" value={draft.privacyConsent} onValueChange={(privacyConsent) => setDraft({ ...draft, privacyConsent })} /></View><Action label="Save profile" action={async () => { if (draft.avatarUrl && !/^https:\/\//.test(draft.avatarUrl)) throw new Error("Use an HTTPS image URL."); await saveProfile(draft); setEditing(false); }} /><Button quiet onPress={() => setEditing(false)}>Cancel</Button></Card> : null}
    <Card><Label>Setup & privacy</Label><Action quiet label="Resume unfinished setup" action={async () => { const saved = await createDraftStore(SecureStore, userId).load(); if (saved && saved.step < 3) router.push("/(workspace)/onboarding"); else notify("Your setup is complete. You can edit your answers above."); }} /><Body>Setup diagnostics stay on this phone. They contain timing and completion counts, never your entry text or answers. Share them only if you want help with setup.</Body><Action quiet label="Share setup diagnostics" action={async () => { const metrics = await readSetupMetrics(userId); await Share.share({ message: JSON.stringify(metrics, null, 2) }); }} /></Card>
    <Card><Label>Appearance</Label><Action quiet label={theme === "warm" ? "Use midnight theme" : "Use warm theme"} action={() => setTheme(theme === "warm" ? "midnight" : "warm")} /></Card>
    <Card><Label>Your data</Label><Body>Export your account data as JSON, or merge a previous Solace backup into this account. Existing records are not cleared first.</Body><Action label="Export my data" action={() => exportAccount(api)} /><Action quiet label="Choose backup file" action={async () => { setBackup(null); setBackup(await chooseBackup()); }} />
      {backup ? <><Body>Ready to merge {Object.values(backup.data).reduce((sum, rows) => sum + rows.length, 0)} records. This restores profiles, manifestations, intentions, reflections, visualizations, progress, favorites, and reminders. All sections are merged together or none are changed.</Body><Action label="Confirm merge into my account" action={async () => { await api("/api/account/data", { method: "POST", body: backup }); setBackup(null); await refresh(); notify("Backup merged"); }} /><Button quiet onPress={() => setBackup(null)}>Cancel restore</Button></> : null}
      <Body>If restore fails, your existing account data stays unchanged. A restore merges records without clearing your account.</Body>
    </Card>
    <Card><Button quiet onPress={() => { void WebBrowser.openBrowserAsync(`${process.env.EXPO_PUBLIC_API_URL}/privacy`); }}>Privacy Policy</Button><Button quiet onPress={() => { void WebBrowser.openBrowserAsync(`${process.env.EXPO_PUBLIC_API_URL}/terms`); }}>Terms of Service</Button><Action quiet label="Sign out" action={signOut} /><Button quiet onPress={deleteAccount}>Delete account permanently</Button></Card>
  </Screen>;
}
