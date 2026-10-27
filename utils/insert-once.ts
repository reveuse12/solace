import type { SupabaseClient } from "@supabase/supabase-js";

/** Reuse the caller's UUID for retries; never overwrite a row on conflict. RLS stays enforced. */
export async function insertOnce(client: SupabaseClient, table: string, owner: string, values: Record<string, unknown>, clientId?: unknown) {
  if (clientId !== undefined && (typeof clientId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId))) {
    return { data: null, error: "Invalid draft identifier", status: 400 };
  }
  const row = { ...values, clerk_user_id: owner, ...(clientId ? { id: clientId } : {}) };
  if (!clientId) {
    const result = await client.from(table).insert(row).select().single();
    return { ...result, status: result.error ? 502 : 201 };
  }
  const result = await client.from(table).upsert(row, { onConflict: "id", ignoreDuplicates: true }).select().maybeSingle();
  if (result.error) return { data: null, error: "Save failed", status: 502 };
  if (result.data) return { data: result.data, error: null, status: 201 };
  const existing = await client.from(table).select("*").eq("id", clientId).eq("clerk_user_id", owner).maybeSingle();
  if (existing.error || !existing.data) return { data: null, error: "This draft identifier is unavailable. Please retry with a new draft.", status: 409 };
  if (Object.entries(values).some(([key, value]) => existing.data[key] !== value)) return { data: null, error: "This draft was already saved with different content. Your current words have not been changed.", status: 409 };
  return { data: existing.data, error: null, status: 200 };
}
