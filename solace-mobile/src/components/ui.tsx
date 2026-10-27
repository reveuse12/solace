import { palettes, usePalette } from "../lib/theme";
import { useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkspace } from "../lib/workspace";

export const colors = palettes.warm;
export function Button({ children, onPress, disabled = false, quiet = false }: { children: ReactNode; onPress: () => void; disabled?: boolean; quiet?: boolean }) {
  const p = usePalette();
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, { backgroundColor: p.button }, quiet && [s.quiet, { backgroundColor: p.quiet, borderColor: p.border }], (disabled || pressed) && { opacity: 0.5 }]}><Text style={[s.buttonText, { color: quiet ? p.ink : p.buttonText }]}>{children}</Text></Pressable>;
}
export function Action({ label, action, quiet }: { label: string; action: () => Promise<unknown>; quiet?: boolean }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const pending = useRef(false);
  return <View style={s.gap}><Button disabled={busy} quiet={quiet} onPress={async () => { if (pending.current) return; pending.current = true; setBusy(true); setError(""); try { await action(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Please try again."); } finally { pending.current = false; setBusy(false); } }}>{busy ? "Working…" : label}</Button>{error ? <ErrorText>{error}</ErrorText> : null}</View>;
}
export function Label({ children }: { children: ReactNode }) { const p = usePalette(); return <Text style={[s.label, { color: p.muted }]}>{children}</Text>; }
export function Title({ children }: { children: ReactNode }) { const p = usePalette(); return <Text accessibilityRole="header" style={[s.title, { color: p.ink }]}>{children}</Text>; }
export function Body({ children }: { children: ReactNode }) { const p = usePalette(); return <Text style={[s.body, { color: p.ink }]}>{children}</Text>; }
export function ErrorText({ children }: { children: ReactNode }) { const p = usePalette(); return <Text accessibilityRole="alert" style={[s.error, { color: p.error }]}>{children}</Text>; }
export function Card({ children }: { children: ReactNode }) { const p = usePalette(); return <View style={[s.card, { backgroundColor: p.surface }]}>{children}</View>; }
export function Field({ label, value, onChange, multiline = false, maxLength = 5000, placeholder, keyboardType, editable = true }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; maxLength?: number; placeholder?: string; editable?: boolean; keyboardType?: "default" | "url" | "numbers-and-punctuation" }) {
  const p = usePalette();
  return <View style={s.gap}><Label>{label}</Label><TextInput accessibilityLabel={label} editable={editable} value={value} onChangeText={onChange} multiline={multiline} maxLength={maxLength} placeholder={placeholder} placeholderTextColor={p.placeholder} keyboardType={keyboardType} style={[s.input, { color: p.ink, borderBottomColor: p.border }, multiline && { minHeight: 110, textAlignVertical: "top" }]} /></View>;
}
export function Choices({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) {
  const p = usePalette();
  return <View style={s.wrap}>{items.map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: item === value }} onPress={() => onChange(item)} style={[s.choice, { borderColor: p.border }, item === value && { backgroundColor: p.button }]}><Text style={{ color: item === value ? p.buttonText : p.ink, fontSize: 15 }}>{item}</Text></Pressable>)}</View>;
}
export function Loading() { const p = usePalette(); return <SafeAreaView style={[s.page, { backgroundColor: p.pink }]}><View style={[s.content, { flex: 1, justifyContent: "center" }]}><ActivityIndicator color={p.ink} /><Body>Opening your space…</Body></View></SafeAreaView>; }
export function Message({ title, detail, children }: { title: string; detail: string; children?: ReactNode }) { const p = usePalette(); return <SafeAreaView style={[s.page, { backgroundColor: p.pink }]}><View style={[s.content, { flex: 1, justifyContent: "center" }]}><Label>solace</Label><Title>{title}</Title><Body>{detail}</Body>{children}</View></SafeAreaView>; }
export function Screen({ title, label, children }: { title: string; label: string; children: ReactNode }) {
  const p = usePalette();
  const { theme, refresh, error, clearError, notice } = useWorkspace(); const [refreshing, setRefreshing] = useState(false);
  return <SafeAreaView edges={["top", "left", "right"]} style={[s.page, { backgroundColor: p.pink }]}><StatusBar style={theme === "midnight" ? "light" : "dark"} /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); try { await refresh(); } finally { setRefreshing(false); } }} />}><Label>{label}</Label><Title>{title}</Title>{error ? <Card><ErrorText>{error}</ErrorText><Button quiet onPress={() => { clearError(); void refresh(); }}>Retry sync</Button></Card> : null}{notice ? <Text accessibilityLiveRegion="polite" style={[s.notice, { backgroundColor: p.notice, color: p.ink }]}>{notice}</Text> : null}{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.pink }, content: { padding: 24, paddingBottom: 48, gap: 20, width: "100%", maxWidth: 760, alignSelf: "center" },
  title: { fontFamily: "serif", color: colors.ink, fontSize: 38, lineHeight: 44, letterSpacing: -1 }, label: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: colors.muted, lineHeight: 17 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 25, flexShrink: 1 }, card: { backgroundColor: colors.surface, borderRadius: 20, padding: 22, gap: 18 }, gap: { gap: 10 },
  button: { minHeight: 48, padding: 14, borderRadius: 26, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }, buttonText: { color: colors.surface, fontSize: 15, textAlign: "center" },
  quiet: { backgroundColor: "#efdce5", borderWidth: 1, borderColor: "#c99fb3" }, input: { borderBottomWidth: 1, borderBottomColor: colors.ink, paddingVertical: 14, fontSize: 18, color: colors.ink, minHeight: 48 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, choice: { minHeight: 48, padding: 14, borderWidth: 1, borderColor: "#b77e98", borderRadius: 16, justifyContent: "center" },
  error: { color: "#96372e", fontSize: 15, lineHeight: 23 }, notice: { color: colors.ink, fontSize: 14, padding: 14, backgroundColor: "#edcfdf", borderRadius: 12 }, row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 14 },
});
