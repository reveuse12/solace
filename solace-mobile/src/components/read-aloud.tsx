import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, View } from "react-native";
import { usePathname } from "expo-router";
import * as Speech from "expo-speech";
import { Body, Button, ErrorText } from "./ui";

const ReaderContext = createContext<{
  active: string | null; voices: Speech.Voice[]; voice: string; setVoice: (id: string) => void;
  rate: number; setRate: (rate: number) => void; error: string;
  play: (id: string, text: string) => Promise<void>; stop: () => Promise<void>;
} | null>(null);

export function ReadAloudProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const [voices, setVoices] = useState<Speech.Voice[]>([]);
  const [voice, setVoice] = useState(""); const [rate, setRate] = useState(0.85);
  const [error, setError] = useState(""); const generation = useRef(0);
  const path = usePathname();
  async function stop() {
    const token = ++generation.current;
    try { await Speech.stop(); if (token === generation.current) setActive(null); } catch { setError("Couldn't stop playback. Check your phone's speech settings."); }
  }
  useEffect(() => {
    let mounted = true;
    void Speech.getAvailableVoicesAsync().then((items) => {
      if (!mounted) return;
      const sorted = [...items].sort((a, b) => Number(b.quality === Speech.VoiceQuality.Enhanced) - Number(a.quality === Speech.VoiceQuality.Enhanced));
      setVoices(sorted);
      setVoice(sorted.find((item) => /^en[-_]/i.test(item.language))?.identifier || sorted[0]?.identifier || "");
    }).catch(() => { if (mounted) setError("Voice list unavailable. Your phone's default voice will be used."); });
    const listener = AppState.addEventListener("change", (state) => { if (state !== "active") void stop(); });
    return () => { mounted = false; listener.remove(); void stop(); };
  }, []);
  useEffect(() => {
    const token = ++generation.current;
    void Speech.stop().then(() => { if (token === generation.current) setActive(null); }).catch(() => { if (token === generation.current) setError("Could not stop playback."); });
  }, [path]);
  async function play(id: string, text: string) {
    const token = ++generation.current; setError(""); setActive(id);
    try {
      await Speech.stop();
      if (token !== generation.current) return;
      const limit = Math.max(1, Math.min(Speech.maxSpeechInputLength, 3000));
      const chunks: string[] = [];
      let remaining = text;
      while (remaining.length > limit) {
        const candidate = remaining.slice(0, limit);
        const boundary = Math.max(candidate.lastIndexOf(" "), candidate.lastIndexOf("\n"));
        const end = boundary > 0 ? boundary + 1 : limit;
        chunks.push(remaining.slice(0, end)); remaining = remaining.slice(end);
      }
      if (remaining) chunks.push(remaining);
      const selected = voices.find((item) => item.identifier === voice);
      const next = (index: number) => {
        if (token !== generation.current) return;
        if (index >= chunks.length) { setActive(null); return; }
        Speech.speak(chunks[index], {
          voice: voice || undefined, language: selected?.language, rate, pitch: 1,
          onDone: () => next(index + 1),
          onStopped: () => { if (token === generation.current) setActive(null); },
          onError: () => { if (token === generation.current) { setActive(null); setError("Couldn't read this entry. Try another voice or check your phone's speech settings."); } },
        });
      };
      next(0);
    } catch { if (token === generation.current) { setActive(null); setError("Read aloud is unavailable. Check your phone's speech settings."); } }
  }
  return <ReaderContext.Provider value={{ active, voices, voice, setVoice, rate, setRate, error, play, stop }}>{children}</ReaderContext.Provider>;
}

export function ReadAloud({ id, text }: { id: string; text: string }) {
  const reader = useContext(ReaderContext); const [settings, setSettings] = useState(false);
  const latest = useRef(reader);
  useEffect(() => { latest.current = reader; }, [reader]);
  useEffect(() => () => { if (latest.current?.active === id) void latest.current.stop(); }, [id]);
  if (!reader) return null;
  return <View style={{ gap: 10 }}>
    <Button quiet onPress={() => { void (reader.active === id ? reader.stop() : reader.play(id, text)); }}>{reader.active === id ? "Stop reading" : "Read aloud"}</Button>
    <Button quiet onPress={() => setSettings(!settings)}>{settings ? "Hide voice options" : "Voice & pace"}</Button>
    {settings ? <><Body>Uses your phone’s speech engine. Voice quality and network use depend on that engine.</Body>
      {[0.75, 0.85, 1].map((speed) => <Button quiet key={speed} onPress={() => { void reader.stop(); reader.setRate(speed); }}>{reader.rate === speed ? "✓ " : ""}{speed === 0.75 ? "Slow" : speed === 0.85 ? "Gentle" : "Normal"}</Button>)}
      <Button quiet onPress={() => { void reader.stop(); reader.setVoice(""); }}>{!reader.voice ? "✓ " : ""}Phone default voice</Button>
      {reader.voices.map((voice) => <Button quiet key={voice.identifier} onPress={() => { void reader.stop(); reader.setVoice(voice.identifier); }}>{reader.voice === voice.identifier ? "✓ " : ""}{voice.name} · {voice.language}</Button>)}
    </> : null}
    {reader.error ? <ErrorText>{reader.error}</ErrorText> : null}
  </View>;
}
