import type { useWritingDraft } from "../lib/use-writing-draft";
import { Action, Body, ErrorText } from "./ui";
export function DraftNotice({ draft }: { draft: ReturnType<typeof useWritingDraft> }) {
  return <>{!draft.ready && !draft.error ? <Body>Restoring your draft…</Body> : null}{draft.error ? <><ErrorText>{draft.error}</ErrorText><Action quiet label="Retry draft" action={draft.retry} /></> : null}</>;
}
