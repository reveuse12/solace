import { usePalette } from "../../../lib/theme";
import * as SecureStore from "expo-secure-store";
import { createDraftStore } from "../../../lib/onboarding-draft";
import { ReadAloud } from "../../../components/read-aloud";
import { useEffect, useMemo, useState } from "react";
import { Share, Text, View } from "react-native";
import { router } from "expo-router";
import { useWorkspace } from "../../../lib/workspace";
import { EntryCard, EntryComposer } from "../../../components/entries";
import { Action, Body, Button, Card, Choices, Field, Label, Screen, Title } from "../../../components/ui";

const affirmations = ["Everything I am becoming is already making its way to me.", "I am allowed to move at the pace that feels true.", "My life has room for the things I deeply desire."];
export default function Today() {
  const colors = usePalette();
  const { userId, profile, data, notify, story, saveStory } = useWorkspace();
  const draftStore = useMemo(() => createDraftStore(SecureStore, userId), [userId]);
  useEffect(() => {
    let active = true;
    void draftStore.load().then(draft => {
      if (active && draft && draft.step < 3) router.replace("/(workspace)/onboarding");
    }).catch(() => { if (active) notify("Your setup draft couldn't be loaded. You can retry from Profile."); });
    return () => { active = false; };
  }, [draftStore, notify]);
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState("All");
  const [affirmation, setAffirmation] = useState(0); const [storySubject, setStorySubject] = useState("");
  const wall = data.desires.filter((entry) => entry.body.toLowerCase().includes(search.toLowerCase()) && (filter === "All" || entry.status === filter.toLowerCase()));
  const starters: Record<string, string[]> = { Clarity: ["A clear next step", "Work that matters", "Room to think"], Confidence: ["Trusting my own voice", "Taking the next step", "Showing up as myself"], Rest: ["Room to breathe", "An unrushed morning", "Rest without guilt"], Connection: ["Meaningful friendships", "Time with people I love", "Feeling understood"] };
  const subject = storySubject || data.desires[0]?.body;
  return <Screen label={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} title={`${profile?.display_name || "You"}, what do you manifest?`}>
    <View style={{ alignItems: "center", paddingVertical: 18 }}><View accessible={false} style={{ width: 128, height: 128, borderRadius: 64, backgroundColor: colors.rose, alignItems: "center", justifyContent: "center" }}><Text style={{ fontFamily: "serif", fontSize: 70, color: colors.ink }}>s</Text></View></View>
    <EntryComposer resource="desires" label="What are you calling in?" maxLength={1000} saveLabel="Save manifestation" ideas={starters[profile?.focus || ""] || ["Dream home", "A meaningful career", "Room to breathe"]} />
    <Card><Label>Daily affirmation · {affirmation + 1} / 03</Label><Title>“{affirmations[affirmation]}”</Title><Button quiet onPress={() => setAffirmation((affirmation + 1) % affirmations.length)}>Another affirmation</Button><Action quiet label="Share affirmation" action={() => Share.share({ message: affirmations[affirmation] })} /></Card>
    <Card><Label>Your future self</Label><Body>A written story template inspired by your manifestation. Creating a story does not send your entry to an AI voice or writing service.</Body><Body>{subject ? `A story inspired by “${subject}”.` : "Save a manifestation to begin your story."}</Body><Action label={story ? "Regenerate my story" : "Create my story"} action={async () => { if (!subject) throw new Error("Save a manifestation first."); await saveStory(`You wake to a day that feels spacious and unmistakably yours. The desire you named — “${subject}” — is no longer something you chase. It is a quiet direction beneath every choice: the room you make, the people you welcome, and the way you let yourself receive. Tonight, you notice one small moment that proves you are already moving toward it.`); }} />{story ? <><Body>{story}</Body><Label>Saved on this device</Label><ReadAloud id="today:story" text={story} /><Action quiet label="Share story" action={() => Share.share({ message: story })} /></> : null}<Button quiet onPress={() => router.push("/(workspace)/(tabs)/reflect")}>Begin a visualization</Button></Card>
    <Label>Wall of manifestations</Label><Field label="Search your manifestations" value={search} onChange={setSearch} maxLength={200} /><Choices items={["All", "Active", "Manifested"]} value={filter} onChange={setFilter} />
    {wall.length ? wall.map((entry) => <EntryCard key={entry.id} resource="desires" entry={entry} onUse={() => { setStorySubject(entry.body); notify("Selected for your story"); }} />) : <Card><Body>{data.desires.length ? "No manifestations match this search." : "Your wall is ready for the first thing you want to call in."}</Body></Card>}
    <Label>Daily intentions</Label><EntryComposer resource="intentions" label="Today, I make room for…" />{data.intentions.map((entry) => <EntryCard key={entry.id} resource="intentions" entry={entry} />)}
  </Screen>;
}
