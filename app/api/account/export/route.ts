import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

const tables = ["profiles", "desires", "intentions", "reflections", "visualizations", "listening_progress", "favorites", "reminders", "push_subscriptions"] as const;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await Promise.all(tables.map(async (table) => {
    const rows: Record<string, unknown>[] = [];
    let count: number | null = null;
    const key = table === "profiles" ? "clerk_user_id" : table === "favorites" || table === "listening_progress" ? "audio_key" : "id";
    do {
      const result = await client.from(table).select("*", { count: "exact" }).eq("clerk_user_id", userId).order(key).range(rows.length, rows.length + 499);
      if (result.error) return { table, data: [], error: result.error };
      if (count !== null && result.count !== count) return { table, data: [], error: "Data changed during export. Please retry." };
      count = result.count;
      if (!result.data?.length) {
        if (count !== null && rows.length < count) return { table, data: [], error: "Incomplete export. Please retry." };
        break;
      }
      rows.push(...result.data);
    } while (count !== null && rows.length < count);
    return { table, data: rows, error: null };
  }));
  const failed = entries.find((entry) => entry.error);
  if (failed) return NextResponse.json({ error: `Could not export ${failed.table}` }, { status: 502 });

  const payload = Object.fromEntries(entries.map(({ table, data }) => [table, data]));
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), userId, data: payload }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="solace-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
