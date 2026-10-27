import { useWritingDraft } from "../lib/use-writing-draft";
import { DraftNotice } from "./draft-notice";
import { ReadAloud } from "./read-aloud";
import { useState } from "react";
import { Alert, Share, View } from "react-native";
import type { Entry } from "../lib/models";
import { useWorkspace } from "../lib/workspace";
import { Action, Body, Button, Card, Choices, Field, Label, s } from "./ui";

export function EntryComposer({ resource, label, maxLength = 500, saveLabel = "Save", ideas }: { resource: "desires" | "intentions" | "reflections"; label: string; maxLength?: number; saveLabel?: string; ideas?: string[] }) {
  const draft = useWritingDraft(resource); const { mutate, notify } = useWorkspace();
  const body = draft.value.body;
  return <Card><DraftNotice draft={draft} />{draft.ready ? <><Field label={label} editable={!draft.busy} value={body} onChange={body => draft.change({ body })} maxLength={maxLength} multiline /><Action label={saveLabel} action={async () => {
    if (!body.trim()) throw new Error("Write something first.");
    await draft.submit(snapshot => mutate(`/api/${resource}`, { body: snapshot.body, clientId: snapshot.clientId })); notify("Saved to your account");
  }} />{ideas ? <><Label>Ideas to begin with</Label><Choices items={ideas} value={body} onChange={body => draft.change({ body })} /></> : null}</> : null}</Card>;
}
export function EntryCard({ entry, resource, onUse }: { entry: Entry; resource: "desires" | "intentions" | "reflections"; onUse?: () => void }) {
  const { mutate, notify } = useWorkspace(); const [editing, setEditing] = useState(false); const [body, setBody] = useState(entry.body); const [expanded, setExpanded] = useState(false);
  function archive() {
    Alert.alert("Archive this manifestation?", "It will be removed from your wall.", [{ text: "Keep", style: "cancel" }, { text: "Archive", onPress: () => { void mutate(`/api/desires/${encodeURIComponent(entry.id)}`, undefined, "DELETE").then(() => notify("Manifestation archived")).catch((error) => Alert.alert("Couldn't archive", error.message)); } }]);
  }
  return <Card><Label>{new Date(entry.created_at).toLocaleDateString()} {entry.status ? `· ${entry.status}` : ""}</Label>{editing ? <><Field label="Edit your words" value={body} onChange={setBody} maxLength={resource === "reflections" ? 5000 : resource === "desires" ? 1000 : 500} multiline /><Action label="Save changes" action={async () => { if (!body.trim()) throw new Error("Your words can't be empty."); await mutate(`/api/${resource}/${encodeURIComponent(entry.id)}`, { body }, "PATCH"); setEditing(false); notify("Changes saved"); }} /><Button quiet onPress={() => { setBody(entry.body); setEditing(false); }}>Cancel</Button></> : <><Body>{expanded || entry.body.length < 180 ? entry.body : `${entry.body.slice(0, 180)}…`}</Body><ReadAloud id={`${resource}:${entry.id}`} text={entry.body} /><View style={s.gap}>{entry.body.length >= 180 ? <Button quiet onPress={() => setExpanded(!expanded)}>{expanded ? "Show less" : "Read more"}</Button> : null}<Button quiet onPress={() => { setBody(entry.body); setEditing(true); }}>Edit</Button>{resource === "desires" ? <><Action quiet label={entry.status === "manifested" ? "Mark active" : "Mark manifested"} action={() => mutate(`/api/desires/${encodeURIComponent(entry.id)}`, { status: entry.status === "manifested" ? "active" : "manifested" }, "PATCH")} /><Action quiet label="Share" action={() => Share.share({ message: entry.body })} />{onUse ? <Button quiet onPress={onUse}>Use in my story</Button> : null}<Button quiet onPress={archive}>Archive</Button></> : null}</View></>}</Card>;
}
