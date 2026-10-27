import { createSecureRecord, safeStorageId, type SecureStorage } from "./secure-record";
export type WritingDraft = { version: 1; clientId: string; body: string; title: string; prompt: string; editing: string | null };
export function createWritingDraftStore(storage: SecureStorage, userId: string, name: string) {
  return createSecureRecord<WritingDraft>(storage, `solace.writing.v1.${safeStorageId(userId)}.${safeStorageId(name)}`, value => {
    const draft = value as WritingDraft;
    if (!draft || draft.version !== 1 || typeof draft.clientId !== "string" || !/^[0-9a-f-]{36}$/i.test(draft.clientId) ||
      typeof draft.body !== "string" || draft.body.length > 5000 || typeof draft.title !== "string" || draft.title.length > 160 ||
      typeof draft.prompt !== "string" || draft.prompt.length > 3000 || (draft.editing !== null && typeof draft.editing !== "string")) throw new Error("Your saved writing couldn't be read.");
    return draft;
  });
}

export async function clearWritingDrafts(storage: SecureStorage, userId: string) {
  await Promise.all(["desires", "intentions", "reflections", "visualizations"].map(name => createWritingDraftStore(storage, userId, name).clear()));
}
