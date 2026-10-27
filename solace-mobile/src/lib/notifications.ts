import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Reminder } from "./models";
import { reminderPlan } from "./reminder-plan";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) });
async function cancelSchedules(keepUserId?: string) {
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(requests.filter((request) => request.identifier.startsWith("solace:") && (!keepUserId || !request.identifier.startsWith(`solace:${keepUserId}:`))).map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}
export async function enableNotifications() {
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("practice", { name: "Practice reminders", importance: Notifications.AndroidImportance.DEFAULT });
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}
let pending: Promise<unknown> = Promise.resolve();
let revision = 0;
export function clearLocalReminders() {
  ++revision;
  const task = pending.catch(() => {}).then(() => cancelSchedules());
  pending = task;
  return task;
}
// On cold start keep this account's alarms even when the server is offline.
// Only discard alarms belonging to a different signed-in account.
export function prepareReminderAccount(userId: string) {
  const task = pending.catch(() => {}).then(() => cancelSchedules(userId));
  pending = task;
  return task;
}
export function reconcileReminders(userId: string, reminders: Reminder[]) {
  const current = ++revision;
  const task = pending.catch(() => {}).then(async () => {
    if (current !== revision) return false;
    await cancelSchedules();
    if (current !== revision || !(await Notifications.getPermissionsAsync()).granted) return false;
    if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("practice", { name: "Practice reminders", importance: Notifications.AndroidImportance.DEFAULT });
    try {
      for (const item of reminderPlan(userId, reminders)) {
        if (current !== revision) { await cancelSchedules(); return false; }
        await Notifications.scheduleNotificationAsync({
          identifier: item.identifier,
          content: { title: "A moment for yourself", body: item.label, data: { reminderId: item.reminderId, userId }, sound: "default" },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: item.weekday, hour: item.hour, minute: item.minute, channelId: "practice" },
        });
      }
    } catch (error) { await cancelSchedules(); throw error; }
    return true;
  });
  pending = task;
  return task;
}
