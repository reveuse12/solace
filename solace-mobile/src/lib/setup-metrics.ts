import AsyncStorage from "@react-native-async-storage/async-storage";
type Event = "started" | "privacy" | "personalize" | "entry" | "first_entry_saved" | "completed" | "sync_failed" | "opened";
type Metrics = { version: 1; startedAt?: number; firstEntryAt?: number; completedAt?: number; lastStep?: Event; syncFailures: number; nextDayReturn: boolean };
let pending: Promise<unknown> = Promise.resolve();
const keyFor = (userId: string) => `solace:${userId}:setup-metrics-v1`;
export async function readSetupMetrics(userId: string): Promise<Metrics> {
  return JSON.parse(await AsyncStorage.getItem(keyFor(userId)) || "null") || { version: 1, syncFailures: 0, nextDayReturn: false };
}
export function recordSetupEvent(userId: string, event: Event) {
  const task = pending.catch(() => {}).then(async () => {
    const value = await readSetupMetrics(userId); const now = Date.now();
    if (event === "started") value.startedAt ??= now;
    if (event === "first_entry_saved") value.firstEntryAt ??= now;
    if (event === "completed") value.completedAt ??= now;
    if (event === "sync_failed") value.syncFailures++;
    if (event === "opened" && value.completedAt) {
      const first = new Date(value.completedAt); const current = new Date(now);
      const dayGap = (Date.UTC(current.getFullYear(), current.getMonth(), current.getDate()) - Date.UTC(first.getFullYear(), first.getMonth(), first.getDate())) / 86400000;
      if (dayGap === 1) value.nextDayReturn = true;
    }
    if (event !== "opened" && event !== "sync_failed") value.lastStep = event;
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(value));
  });
  pending = task; return task;
}
