import type { Reminder } from "./models";
export function reminderPlan(userId: string, reminders: Reminder[]) {
  return reminders.filter((item) => item.enabled).flatMap((item) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::\d{2})?$/.exec(item.time_local);
    if (!match) return [];
    return [...new Set(item.days)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6).map((day) => ({
      identifier: `solace:${userId}:${item.id}:${day}`, hour: Number(match[1]), minute: Number(match[2]), weekday: day + 1, reminderId: item.id, label: item.label,
    }));
  });
}
