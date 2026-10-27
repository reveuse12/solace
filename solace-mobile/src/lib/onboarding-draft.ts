import type { ProfileInput } from "./models";
export type OnboardingDraft = { version: 2; step: number; value: ProfileInput; entry: string; savedEntry: string; reminderTime: string };
type Storage = { getItemAsync: (key: string) => Promise<string | null>; setItemAsync: (key: string, value: string) => Promise<void>; deleteItemAsync: (key: string) => Promise<void> };
const MAX_CHUNKS = 32;
export function createDraftStore(storage: Storage, userId: string) {
  const base = `solace.onboarding.v2.${Array.from(userId, c => c.codePointAt(0)!.toString(16)).join("-")}`;
  let pending: Promise<unknown> = Promise.resolve();
  function enqueue<T>(action: () => Promise<T>): Promise<T> {
    const task = pending.catch(() => {}).then(action); pending = task; return task;
  }
  return {
    load: () => enqueue(async (): Promise<OnboardingDraft | null> => {
      const pointer = await storage.getItemAsync(`${base}.pointer`);
      if (pointer === null) return null;
      if (pointer !== "a" && pointer !== "b") throw new Error("Your setup draft couldn't be read.");
      const count = Number(await storage.getItemAsync(`${base}.${pointer}.count`));
      if (!Number.isInteger(count) || count < 1 || count > MAX_CHUNKS) throw new Error("Your setup draft is incomplete.");
      const pieces = await Promise.all(Array.from({ length: count }, (_, i) => storage.getItemAsync(`${base}.${pointer}.${i}`)));
      if (pieces.some(piece => piece === null)) throw new Error("Your setup draft is incomplete.");
      const draft = JSON.parse(pieces.join(""));
      if (draft?.version !== 2 || !Number.isInteger(draft.step) || draft.step < 0 || draft.step > 3 ||
        typeof draft.entry !== "string" || draft.entry.length > 1000 || typeof draft.savedEntry !== "string" ||
        typeof draft.reminderTime !== "string" || !draft.value ||
        ["displayName", "location", "focus", "practiceTime"].some(key => typeof draft.value[key] !== "string" || draft.value[key].length > 120) ||
        typeof draft.value.privacyConsent !== "boolean") throw new Error("Your setup draft couldn't be read.");
      return draft;
    }),
    save: (draft: OnboardingDraft) => enqueue(async () => {
      const json = JSON.stringify(draft);
      const chunks = json.match(/[\s\S]{1,400}/g) || [];
      if (chunks.length > MAX_CHUNKS) throw new Error("Your setup draft is too large to save.");
      // Two slots keep the previous complete draft readable if a write is interrupted.
      const slot = await storage.getItemAsync(`${base}.pointer`) === "a" ? "b" : "a";
      for (let i = 0; i < chunks.length; i++) await storage.setItemAsync(`${base}.${slot}.${i}`, chunks[i]);
      await storage.setItemAsync(`${base}.${slot}.count`, String(chunks.length));
      await storage.setItemAsync(`${base}.pointer`, slot);
    }),
    clear: () => enqueue(async () => {
      await storage.deleteItemAsync(`${base}.pointer`);
      for (const slot of ["a", "b"]) {
        for (let i = 0; i < MAX_CHUNKS; i++) await storage.deleteItemAsync(`${base}.${slot}.${i}`);
        await storage.deleteItemAsync(`${base}.${slot}.count`);
      }
    }),
  };
}
