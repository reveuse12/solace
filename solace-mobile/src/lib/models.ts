export type Profile = { display_name: string; location: string | null; focus: string | null; practice_time: string | null; avatar_url: string | null; privacy_consent_at: string | null };
export type ProfileInput = { displayName: string; location: string; focus: string; practiceTime: string; avatarUrl?: string; privacyConsent: boolean };
export type Entry = { id: string; body: string; created_at: string; status?: string };
export type Visualization = { id: string; title: string; prompt: string | null; mood: string | null; completed: boolean; created_at: string };
export type Reminder = { id: string; label: string; time_local: string; timezone: string; days: number[]; enabled: boolean };
export type Favorite = { audio_key: string };
export type WorkspaceData = { desires: Entry[]; intentions: Entry[]; reflections: Entry[]; visualizations: Visualization[]; reminders: Reminder[]; favorites: Favorite[] };
export const emptyData: WorkspaceData = { desires: [], intentions: [], reflections: [], visualizations: [], reminders: [], favorites: [] };
export const focuses = ["Clarity", "Confidence", "Rest", "Connection"];
export const practiceTimes = ["Morning", "Evening", "Whenever feels right"];
export const audioCatalog = [
  { key: "arrive", title: "Arrive in the present", category: "Calm", duration: "08 min", description: "A gentle reset for a busy mind." },
  { key: "future-self", title: "Meet your future self", category: "Visualize", duration: "12 min", description: "A guided practice for seeing what is unfolding." },
  { key: "quiet-confidence", title: "Quiet confidence", category: "Confidence", duration: "10 min", description: "Settle into your own steady voice." },
];
export const templates = [
  { title: "A room I feel at home in", prompt: "Notice the light, the textures, and the way your body feels in this place." },
  { title: "The next version of me", prompt: "Meet yourself six months from now. What did you choose to protect?" },
  { title: "A day with room to breathe", prompt: "Let the day unfold slowly. Notice one moment you would usually rush past." },
];
// Consent is the server-confirmed completion marker. Personalization is optional.
export function profileIsComplete(profile: Profile | null): profile is Profile {
  return Boolean(profile?.privacy_consent_at);
}
export function profileInput(profile: Profile | null): ProfileInput {
  return { displayName: profile?.display_name ?? "", location: profile?.location ?? "", focus: profile?.focus ?? "", practiceTime: profile?.practice_time ?? "", avatarUrl: profile?.avatar_url ?? "", privacyConsent: Boolean(profile?.privacy_consent_at) };
}
export function validateProfile(value: ProfileInput) {
  if (!value.privacyConsent) throw new Error("Please accept the privacy terms to continue.");
  if (value.focus && !focuses.includes(value.focus)) throw new Error("Choose a listed focus or leave it blank.");
  if (value.practiceTime && !practiceTimes.includes(value.practiceTime)) throw new Error("Choose a listed practice time or leave it blank.");
  if (value.displayName.length > 120 || value.location.length > 120) throw new Error("Keep your name and location under 120 characters.");
  return { ...value, displayName: value.displayName.trim(), location: value.location.trim() };
}
