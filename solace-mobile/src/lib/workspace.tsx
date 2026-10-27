import { ThemeProvider } from "./theme";
import { recordSetupEvent } from "./setup-metrics";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { createApiClient, type ApiClient } from "./api-client";
import { emptyData, profileIsComplete, validateProfile, type Profile, type ProfileInput, type WorkspaceData } from "./models";
import { clearLocalReminders, enableNotifications, prepareReminderAccount, reconcileReminders } from "./notifications";

type Workspace = {
  userId: string; profile: Profile | null; profileFetched: boolean; data: WorkspaceData; loading: boolean; error: string; notice: string;
  api: ApiClient; refresh: () => Promise<void>; saveProfile: (value: ProfileInput) => Promise<void>;
  mutate: <T = unknown>(path: string, body?: unknown, method?: string) => Promise<T>;
  signOut: () => Promise<void>; notify: (value: string) => void; clearError: () => void;
  theme: "warm" | "midnight"; setTheme: (value: "warm" | "midnight") => Promise<void>;
  story: string; saveStory: (value: string) => Promise<void>;
  notificationHistory: string[]; enableReminders: () => Promise<void>; permissionGranted: boolean;
};
const Context = createContext<Workspace | null>(null);
const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";
export function WorkspaceProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const { getToken, signOut: clerkSignOut } = useAuth();
  const api = useMemo(() => createApiClient(process.env.EXPO_PUBLIC_API_URL || "https://not-configured.invalid", () => getToken()), [getToken]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileFetched, setProfileFetched] = useState(false);
  const [data, setData] = useState<WorkspaceData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, notify] = useState("");
  const [theme, updateTheme] = useState<"warm" | "midnight">("warm");
  const [story, updateStory] = useState("");
  const [notificationHistory, setHistory] = useState<string[]>([]);
  const [permissionGranted, setPermission] = useState(false);
  const dataRef = useRef(data);
  const dataRevision = useRef(0);
  const closing = useRef(false);
  const profileRevision = useRef(0);
  const savingProfile = useRef(false);
  const storageKey = useCallback((kind: string) => `solace:${userId}:${kind}`, [userId]);
  const loadData = useCallback(async () => {
    if (closing.current) return;
    const currentRevision = ++dataRevision.current;
    const resources = ["desires", "intentions", "reflections", "visualizations", "reminders", "favorites"] as const;
    const results = await Promise.allSettled(resources.map(async (key) => {
      const payload = await api<Record<string, unknown>>(`/api/${key}`);
      if (!Array.isArray(payload[key])) throw new Error(`Couldn't read your ${key}. Please refresh.`);
      return { key, rows: payload[key] };
    }));
    if (closing.current || currentRevision !== dataRevision.current) return;
    const next = { ...dataRef.current };
    const failures: string[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") Object.assign(next, { [result.value.key]: result.value.rows });
      else failures.push(errorText(result.reason));
    }
    dataRef.current = next; setData(next);
    if (failures.length) setError(failures[0]);
    if (results[4].status === "fulfilled") {
      try { setPermission(await reconcileReminders(userId, next.reminders)); }
      catch { setError("Your reminders are saved online, but this phone couldn't schedule them. Enable reminders and try again."); }
    }
  }, [api, userId]);
  const refresh = useCallback(async () => {
    if (closing.current || savingProfile.current) return;
    const revision = ++profileRevision.current;
    setError("");
    try {
      if (!process.env.EXPO_PUBLIC_API_URL) throw new Error("This build is missing its Solace server address.");
      const response = await api<{ profile: Profile | null }>("/api/profile");
      if (closing.current || revision !== profileRevision.current) return;
      if (!("profile" in response)) throw new Error("The profile response was incomplete. Please try again.");
      setProfile(response.profile);
      setProfileFetched(true); setLoading(false);
      if (profileIsComplete(response.profile)) await loadData();
    } catch (caught) { if (!closing.current && revision === profileRevision.current) setError(errorText(caught)); }
    finally { setLoading(false); }
  }, [api, loadData]);
  const closeWorkspace = useCallback(() => {
    closing.current = true; ++profileRevision.current; ++dataRevision.current;
  }, []);
  useEffect(() => {
    closing.current = false;
    void recordSetupEvent(userId, "opened").catch(() => {});
    void prepareReminderAccount(userId).catch(() => setError("This phone's reminders couldn't be checked. Please retry sync."));
    return closeWorkspace;
  }, [userId, closeWorkspace]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => { if (state === "active") { void refresh(); void recordSetupEvent(userId, "opened").catch(() => {}); } });
    return () => listener.remove();
  }, [refresh, userId]);
  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(storageKey("theme")), AsyncStorage.getItem(storageKey("story")), AsyncStorage.getItem(storageKey("history"))]).then(([savedTheme, savedStory, history]) => {
      if (!active) return;
      updateTheme(savedTheme === "midnight" ? "midnight" : "warm");
      updateStory(savedStory || "");
      try { const parsed = JSON.parse(history || "[]"); if (Array.isArray(parsed)) setHistory(parsed.filter((entry) => typeof entry === "string").slice(0, 20)); } catch { /* Preferences never decide whether onboarding is complete. */ }
    }).catch(() => { if (active) setError("Your device preferences couldn't be loaded. Your online profile is unchanged."); });
    const listener = Notifications.addNotificationReceivedListener((notification) => {
      if (notification.request.content.data?.userId !== userId) return;
      setHistory((current) => {
        const next = [`${new Date().toLocaleString()} · ${notification.request.content.body || "Practice reminder"}`, ...current].slice(0, 20);
        void AsyncStorage.setItem(storageKey("history"), JSON.stringify(next)).catch(() => setError("Notification history couldn't be saved on this phone."));
        return next;
      });
    });
    return () => { active = false; listener.remove(); };
  }, [storageKey, userId]);
  async function saveProfile(value: ProfileInput) {
    const payload = validateProfile(value);
    if (savingProfile.current) throw new Error("Your profile is already being saved.");
    savingProfile.current = true; ++profileRevision.current;
    try {
      const response = await api<{ profile: Profile }>("/api/profile", { method: "POST", body: payload });
      if (!profileIsComplete(response.profile)) throw new Error("The server didn't confirm your complete profile. Your answers are still here; please try again.");
      setProfile(response.profile); setProfileFetched(true);
      await loadData(); notify("Profile saved");
    } finally { savingProfile.current = false; }
  }
  async function mutate<T = unknown>(path: string, body?: unknown, method = "POST") {
    const result = await api<T>(path, { method, body });
    if (path === "/api/desires" && method === "POST") void recordSetupEvent(userId, "first_entry_saved").catch(() => {});
    await loadData();
    return result;
  }
  async function signOut() {
    closing.current = true;
    try { await clearLocalReminders(); await Notifications.dismissAllNotificationsAsync(); await clerkSignOut(); }
    catch (caught) { closing.current = false; throw caught; }
  }
  async function setTheme(value: "warm" | "midnight") { await AsyncStorage.setItem(storageKey("theme"), value); updateTheme(value); }
  async function saveStory(value: string) { await AsyncStorage.setItem(storageKey("story"), value); updateStory(value); }
  async function enableReminders() {
    if (!await enableNotifications()) throw new Error("Notifications are disabled. Enable them in your phone's Solace settings to receive reminders.");
    setPermission(await reconcileReminders(userId, dataRef.current.reminders));
    notify("Reminders are enabled on this phone");
  }
  return <Context.Provider value={{ userId, profile, profileFetched, data, loading, error, notice, api, refresh, saveProfile, mutate, signOut, notify, clearError: () => setError(""), theme, setTheme, story, saveStory, notificationHistory, enableReminders, permissionGranted }}><ThemeProvider mode={theme}>{children}</ThemeProvider></Context.Provider>;
}
export function useWorkspace() {
  const workspace = useContext(Context);
  if (!workspace) throw new Error("Solace workspace is not available.");
  return workspace;
}
