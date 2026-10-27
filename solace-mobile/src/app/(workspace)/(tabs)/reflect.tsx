import { useWritingDraft } from "../../../lib/use-writing-draft";
import { DraftNotice } from "../../../components/draft-notice";
import { ReadAloud } from "../../../components/read-aloud";
import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useWorkspace } from "../../../lib/workspace";
import { templates, type Visualization } from "../../../lib/models";
import { EntryCard, EntryComposer } from "../../../components/entries";
import { Action, Body, Button, Card, Choices, Field, Label, Screen, Title, s } from "../../../components/ui";
export default function Reflect() {
  const { data, mutate, notify } = useWorkspace(); const draft = useWritingDraft("visualizations");
  const { title, prompt, editing } = draft.value;
  const [active, setActive] = useState<Visualization | null>(null);
  const [duration, setDuration] = useState("3 minutes"); const [deadline, setDeadline] = useState<number | null>(null); const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [deadline]);
  function remove(item: Visualization) { Alert.alert("Delete this visualization?", "This cannot be undone.", [{ text: "Keep", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => { void mutate(`/api/visualizations/${encodeURIComponent(item.id)}`, undefined, "DELETE").catch((error) => Alert.alert("Couldn't delete", error.message)); } }]); }
  return <Screen label="Make meaning" title="Notice what is true for you.">
    <Label>Reflection</Label><EntryComposer resource="reflections" label="What are you noticing today?" maxLength={5000} />
    {data.reflections.length ? data.reflections.map((entry) => <EntryCard resource="reflections" key={entry.id} entry={entry} />) : <Body>Your reflections will appear here after you save them.</Body>}
    <Label>Visualizations · {data.visualizations.filter((item) => item.completed).length} completed</Label>
    {active ? <Card><Label>{remaining ? "Take a slow breath" : "A moment to notice"}</Label><Title>{active.title}</Title><Body>{active.prompt || "Notice the light, the sounds, and how you feel in this future moment."}</Body><Title>{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</Title><Action label="Complete practice" action={async () => { await mutate(`/api/visualizations/${encodeURIComponent(active.id)}`, { completed: true }, "PATCH"); setActive(null); setDeadline(null); notify("Practice completed"); }} /><Button quiet onPress={() => { setActive(null); setDeadline(null); }}>Leave without completing</Button></Card> : null}
    <Card><DraftNotice draft={draft} />{draft.ready ? <><Label>{editing ? "Edit visualization" : "Create a visualization"}</Label><Field label="Title" editable={!draft.busy} value={title} onChange={title => draft.change({ title })} maxLength={160} /><Field label="What does this future feel like?" editable={!draft.busy} value={prompt} onChange={prompt => draft.change({ prompt })} maxLength={3000} multiline /><Action label={editing ? "Save changes" : "Save visualization"} action={async () => {
      if (!title.trim()) throw new Error("Give your visualization a title.");
      await draft.submit(snapshot => mutate(snapshot.editing ? `/api/visualizations/${encodeURIComponent(snapshot.editing)}` : "/api/visualizations", { title: snapshot.title, prompt: snapshot.prompt, mood: "open", ...(!snapshot.editing ? { clientId: snapshot.clientId } : {}) }, snapshot.editing ? "PATCH" : "POST")); notify("Visualization saved");
    }} />{editing ? <Action quiet label="Cancel edit" action={draft.reset} /> : null}</> : null}</Card>
    <Label>Begin with a prompt</Label>{templates.map((item) => <Button quiet disabled={!draft.ready || draft.busy} key={item.title} onPress={() => { draft.change({ editing: null, title: item.title, prompt: item.prompt }); }}>{item.title}</Button>)}
    <Choices items={["1 minute", "3 minutes", "5 minutes"]} value={duration} onChange={setDuration} />
    {data.visualizations.map((item) => <Card key={item.id}><Label>{item.completed ? "Completed" : "Your visualization"}</Label><Title>{item.title}</Title><Body>{item.prompt}</Body><ReadAloud id={`visualization:${item.id}`} text={`${item.title}. ${item.prompt || ""}`} /><View style={s.gap}><Button onPress={() => { setActive(item); setDeadline(Date.now() + parseInt(duration) * 60000); }}>Begin practice</Button><Button quiet onPress={() => { draft.change({ editing: item.id, title: item.title, prompt: item.prompt || "" }); }}>Edit</Button><Action quiet label={item.completed ? "Mark incomplete" : "Mark completed"} action={() => mutate(`/api/visualizations/${encodeURIComponent(item.id)}`, { completed: !item.completed }, "PATCH")} /><Button quiet onPress={() => remove(item)}>Delete</Button></View></Card>)}
  </Screen>;
}
