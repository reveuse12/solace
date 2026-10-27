import { useState } from "react";
import { Alert, Linking, Switch, View } from "react-native";
import { audioCatalog, type Reminder } from "../../../lib/models";
import { useWorkspace } from "../../../lib/workspace";
import { Action, Body, Button, Card, Choices, Field, Label, Screen, Title, s } from "../../../components/ui";
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export default function Library() {
  const { data, mutate, notify, enableReminders, permissionGranted, notificationHistory } = useWorkspace();
  const [filter, setFilter] = useState("All"); const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); const [label, setLabel] = useState("Daily practice"); const [time, setTime] = useState("20:00"); const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const favorites = data.favorites.map((item) => item.audio_key);
  const items = audioCatalog.filter((item) => (filter === "All" || item.category === filter) && (!onlyFavorites || favorites.includes(item.key)));
  function reset() { setEditing(null); setLabel("Daily practice"); setTime("20:00"); setDays([0, 1, 2, 3, 4, 5, 6]); }
  function edit(item: Reminder) { setEditing(item.id); setLabel(item.label); setTime(item.time_local.slice(0, 5)); setDays(item.days); }
  function remove(item: Reminder) { Alert.alert("Remove reminder?", item.label, [{ text: "Keep", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => { void mutate(`/api/reminders/${encodeURIComponent(item.id)}`, undefined, "DELETE").then(() => notify("Reminder removed")).catch((error) => Alert.alert("Couldn't remove", error.message)); } }]); }
  return <Screen label="Audio rituals" title="Find a little room to breathe.">
    <Choices items={["All", "Calm", "Visualize", "Confidence"]} value={filter} onChange={setFilter} /><View style={s.row}><Body>Favorites only</Body><Switch accessibilityLabel="Favorites only" value={onlyFavorites} onValueChange={setOnlyFavorites} /></View>
    {items.map((item) => <Card key={item.key}><Label>{item.category} · {item.duration}</Label><Title>{item.title}</Title><Body>{item.description}</Body><Body>Audio is coming soon, as in the PWA. No track is available to play yet.</Body><Action quiet label={favorites.includes(item.key) ? "Remove favorite" : "Save favorite"} action={() => mutate("/api/favorites", { audioKey: item.key, favorite: !favorites.includes(item.key) })} /></Card>)}
    {!items.length ? <Card><Body>No practices match these filters.</Body></Card> : null}
    <Label>Your reminders</Label><Card><Body>{permissionGranted ? "Notifications are enabled. Times follow this phone's local time zone; delivery can be delayed by Android battery settings." : "Reminders sync with your account. Enable notifications to receive them on this phone."}</Body><Action label={permissionGranted ? "Refresh phone reminders" : "Enable phone reminders"} action={enableReminders} /><Button quiet onPress={() => { void Linking.openSettings(); }}>Open phone settings</Button></Card>
    <Card><Label>{editing ? "Edit reminder" : "Add a reminder"}</Label><Field label="Reminder label" value={label} onChange={setLabel} maxLength={120} /><Field label="Time (24-hour HH:MM)" value={time} onChange={setTime} maxLength={5} keyboardType="numbers-and-punctuation" />
      <Label>Days of the week</Label>{dayNames.map((day, index) => <View key={day} style={s.row}><Body>{day}</Body><Switch accessibilityLabel={day} value={days.includes(index)} onValueChange={(checked) => setDays(checked ? [...days, index].sort() : days.filter((value) => value !== index))} /></View>)}
      <Action label={editing ? "Save reminder changes" : "Save reminder"} action={async () => { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Enter a time such as 08:30 or 20:00."); if (!days.length) throw new Error("Select at least one day."); await mutate(editing ? `/api/reminders/${encodeURIComponent(editing)}` : "/api/reminders", { label, timeLocal: time, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, days }, editing ? "PATCH" : "POST"); reset(); notify("Reminder saved"); }} />{editing ? <Button quiet onPress={reset}>Cancel edit</Button> : null}
    </Card>
    {data.reminders.length ? data.reminders.map((item) => <Card key={item.id}><Title>{item.label}</Title><Body>{item.time_local.slice(0, 5)} · {item.days.map((day) => dayNames[day]?.slice(0, 3)).join(", ")}</Body><Action quiet label={item.enabled ? "Disable reminder" : "Enable reminder"} action={() => mutate(`/api/reminders/${encodeURIComponent(item.id)}`, { enabled: !item.enabled }, "PATCH")} /><Button quiet onPress={() => edit(item)}>Edit reminder</Button><Button quiet onPress={() => remove(item)}>Remove reminder</Button></Card>) : <Body>No reminders yet. Choose a time that feels right for you.</Body>}
    <Label>Recent notifications on this phone</Label>{notificationHistory.length ? notificationHistory.map((entry, index) => <Body key={`${index}:${entry}`}>{entry}</Body>) : <Body>No notifications have been recorded while the app is open.</Body>}
  </Screen>;
}
