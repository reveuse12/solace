import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

const tables = ["profiles", "intentions", "reflections", "visualizations", "listening_progress", "favorites", "reminders"] as const;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await Promise.all(tables.map(async (table) => {
    const { data, error } = await client.from(table).select("*").eq("clerk_user_id", userId);
    return { table, data: data ?? [], error };
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
