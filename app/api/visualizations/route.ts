import { insertOnce } from "@/utils/insert-once";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await client.from("visualizations").select("*").eq("clerk_user_id", userId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Visualizations lookup failed" }, { status: 502 });
  return NextResponse.json({ visualizations: data });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const { client } = await createClerkSupabaseClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await insertOnce(client, "visualizations", userId, { title, prompt: typeof body.prompt === "string" ? body.prompt.slice(0, 3000) : null, mood: typeof body.mood === "string" ? body.mood.slice(0, 80) : null }, body.clientId);
  if (result.error) return NextResponse.json({ error: typeof result.error === "string" ? result.error : "Couldn't save your entry" }, { status: result.status });
  return NextResponse.json({ visualization: result.data }, { status: result.status });
}
